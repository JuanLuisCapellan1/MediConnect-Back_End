"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoGestionCitasService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const GRACE_MINUTOS = 15; // Minutos de gracia tras el fin de la cita
const CRON_EXPRESSION = '*/5 * * * *'; // Cada 5 minutos
/**
 * AutoGestionCitasService
 *
 * Cron job que corre cada 5 minutos y detecta citas sin diagnóstico.
 *
 * CONDICIÓN DE NO-SHOW:
 *   (fechaInicio + duracionServicio + GRACE_MINUTOS) <= AHORA
 *   AND  historialConsulta IS NULL   (sin diagnóstico)
 *   AND  estado IN ('Programada', 'En curso')
 *
 * ACCIÓN:
 *   1. Cambia estado → 'Cancelada'
 *   2. motivoCancelacion → 'Paciente no se presentó'
 *   3. Notifica al doctor  → WS + DB
 *   4. Notifica al paciente → WS + DB
 *
 * Aplica a AMBAS modalidades: Presencial y Teleconsulta.
 */
class AutoGestionCitasService {
    constructor(prisma, enviarNotifUC) {
        this.prisma = prisma;
        this.enviarNotifUC = enviarNotifUC;
    }
    iniciar() {
        console.log('⏰ AutoGestionCitasService: cron iniciado (cada 5 min).');
        node_cron_1.default.schedule(CRON_EXPRESSION, async () => {
            try {
                await this._procesarNoShows();
            }
            catch (err) {
                console.error('❌ AutoGestionCitasService: error en ciclo:', err);
            }
        });
    }
    // ── Ejecución manual (útil para testing) ─────────────────────────────────
    async ejecutarAhora() {
        return this._procesarNoShows();
    }
    // ── Lógica principal ──────────────────────────────────────────────────────
    async _procesarNoShows() {
        const ahora = this._obtenerAhoraLocalComoUTC();
        // 1. Obtener candidatas (estados posibles + sin historial)
        const candidatas = await this.prisma.cita.findMany({
            where: {
                estado: { in: ['Programada', 'En curso'] },
                historial: null, // sin diagnóstico
            },
            include: {
                servicio: { select: { duracionMinutos: true } },
            },
        });
        // 2. Filtrar por ventana de tiempo (Prisma no hace aritmética de fechas)
        const noShows = candidatas.filter((c) => {
            const duracion = c.servicio?.duracionMinutos ?? 30;
            const fechaFin = new Date(c.fechaInicio.getTime() + duracion * 60000);
            const limite = new Date(fechaFin.getTime() + GRACE_MINUTOS * 60000);
            const debeCancelar = ahora >= limite;
            console.log(`🔎 [CRON-DEBUG] Evaluando Cita ID: ${c.id}`);
            console.log(`   - ahora: ${ahora.toISOString()}`);
            console.log(`   - c.fechaInicio: ${c.fechaInicio.toISOString()}`);
            console.log(`   - limite: ${limite.toISOString()}`);
            console.log(`   - Cancela?: ${debeCancelar}`);
            return debeCancelar;
        });
        if (noShows.length === 0)
            return 0;
        const ids = noShows.map((c) => c.id);
        console.log(`⏰ AutoGestionCitasService: ${noShows.length} cita(s) sin diagnóstico → cancelando [${ids.join(', ')}]`);
        // 3. Cancelar en bloque
        await this.prisma.cita.updateMany({
            where: { id: { in: ids } },
            data: {
                estado: 'Cancelada',
                motivoCancelacion: 'Paciente no se presentó',
                actualizadoEn: ahora,
            },
        });
        // 4. Notificar a cada participante (fallo silencioso por cita)
        for (const cita of noShows) {
            await this._notificar(cita).catch(err => console.error(`❌ AutoGestionCitasService: error notificando cita ${cita.id}:`, err));
        }
        return noShows.length;
    }
    // Helper: Como la BD guarda las fechas combinadas (ej: 4:30 PM local = 16:30Z UTC naive),
    // debemos comparar 'ahora' usando el mismo criterio naive sobre la zona local (America/Santo_Domingo).
    _obtenerAhoraLocalComoUTC() {
        const d = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Santo_Domingo',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        });
        const parts = formatter.formatToParts(d);
        const p = {};
        for (const part of parts) {
            if (part.type !== 'literal')
                p[part.type] = part.value;
        }
        // El formato de hora "24:00" en algunos motores significa "00:00" del día siguiente; 
        // hour12: false suele dar '24' para la medianoche en Node.js antiguo, lo tratamos.
        let hour = p.hour;
        if (hour === '24')
            hour = '00';
        const fechaIsoNaive = `${p.year}-${p.month}-${p.day}T${hour}:${p.minute}:${p.second}.000Z`;
        return new Date(fechaIsoNaive);
    }
    async _notificar(cita) {
        const base = {
            tipoEntidad: 'Cita',
            entidadId: cita.id,
        };
        // Notificación al doctor (si tiene doctor asignado)
        if (cita.doctorUsuarioId) {
            await this.enviarNotifUC.execute({
                ...base,
                usuarioId: cita.doctorUsuarioId,
                titulo: 'Cita cancelada por inasistencia',
                mensaje: `El paciente no se presentó a la cita #${cita.id}. La cita ha sido cancelada automáticamente.`,
                tipoAlerta: 'Advertencia',
            });
        }
        // Notificación al paciente
        await this.enviarNotifUC.execute({
            ...base,
            usuarioId: cita.pacienteId,
            titulo: 'Tu cita fue cancelada',
            mensaje: `No se registró asistencia para tu cita #${cita.id}. Ha sido cancelada automáticamente.`,
            tipoAlerta: 'Advertencia',
        });
    }
}
exports.AutoGestionCitasService = AutoGestionCitasService;
