import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { EnviarNotificacionUseCase } from '../../application/use-cases/notificaciones/EnviarNotificacionUseCase';

const GRACE_MINUTOS = 15;   // Minutos de gracia tras el fin de la cita
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
export class AutoGestionCitasService {

    constructor(
        private readonly prisma: PrismaClient,
        private readonly enviarNotifUC: EnviarNotificacionUseCase,
    ) { }

    iniciar(): void {
        console.log('⏰ AutoGestionCitasService: cron iniciado (cada 5 min).');

        cron.schedule(CRON_EXPRESSION, async () => {
            try {
                await this._procesarEnCurso();
                await this._procesarNoShows();
            } catch (err) {
                console.error('❌ AutoGestionCitasService: error en ciclo:', err);
            }
        });
    }

    // ── Ejecución manual (útil para testing) ─────────────────────────────────
    async ejecutarAhora(): Promise<number> {
        await this._procesarEnCurso();
        return this._procesarNoShows();
    }

    // ── Marcar citas presenciales como "En curso" cuando llega su hora ───────
    private async _procesarEnCurso(): Promise<number> {
        const ahora = this._obtenerAhoraLocalComoUTC();

        // Buscar citas presenciales Programadas/Reprogramadas cuya hora ya llegó
        const candidatas = await (this.prisma.cita as any).findMany({
            where: {
                estado: { in: ['Programada', 'Reprogramada'] },
                modalidad: 'Presencial',
                fechaInicio: { lte: ahora },
                historial: null,        // sin diagnóstico aún
            },
            select: { id: true },
        });

        if (candidatas.length === 0) return 0;

        const ids = candidatas.map((c: any) => c.id);
        console.log(`⏰ AutoGestionCitasService: ${ids.length} cita(s) presencial(es) → marcando 'En curso' [${ids.join(', ')}]`);

        await (this.prisma.cita as any).updateMany({
            where: { id: { in: ids } },
            data: {
                estado: 'En curso',
                actualizadoEn: ahora,
            },
        });

        return ids.length;
    }

    // ── Lógica principal ──────────────────────────────────────────────────────
    private async _procesarNoShows(): Promise<number> {
        const ahora = this._obtenerAhoraLocalComoUTC();

        // 1. Obtener candidatas por modalidad con diferentes criterios de estado:
        //    - Presencial: SOLO 'En curso' (deben haber pasado por _procesarEnCurso primero)
        //    - Teleconsulta/otras: 'Programada' o 'En curso' (comportamiento original)
        const candidatas = await (this.prisma.cita as any).findMany({
            where: {
                historial: null,        // sin diagnóstico
                OR: [
                    // Citas presenciales: solo cuando ya estén en curso
                    { modalidad: 'Presencial', estado: 'En curso' },
                    // Otras modalidades (Teleconsulta, etc.): estado Programada o En curso
                    { modalidad: { not: 'Presencial' }, estado: { in: ['Programada', 'En curso'] } },
                ],
            },
            include: {
                servicio: { select: { duracionMinutos: true } },
            },
        });

        // 2. Filtrar por ventana de tiempo (Prisma no hace aritmética de fechas)
        const noShows = candidatas.filter((c: any) => {
            const duracion = c.servicio?.duracionMinutos ?? 30;
            const fechaFin = new Date(c.fechaInicio.getTime() + duracion * 60_000);
            const limite = new Date(fechaFin.getTime() + GRACE_MINUTOS * 60_000);
            const debeCancelar = ahora >= limite;

            console.log(`🔎 [CRON-DEBUG] Evaluando Cita ID: ${c.id} [${c.modalidad}]`);
            console.log(`   - ahora: ${ahora.toISOString()}`);
            console.log(`   - c.fechaInicio: ${c.fechaInicio.toISOString()}`);
            console.log(`   - limite: ${limite.toISOString()}`);
            console.log(`   - Cancela?: ${debeCancelar}`);

            return debeCancelar;
        });

        if (noShows.length === 0) return 0;

        const ids = noShows.map((c: any) => c.id);
        console.log(`⏰ AutoGestionCitasService: ${noShows.length} cita(s) sin diagnóstico → cancelando [${ids.join(', ')}]`);

        // 3. Cancelar en bloque
        await (this.prisma.cita as any).updateMany({
            where: { id: { in: ids } },
            data: {
                estado: 'Cancelada',
                motivoCancelacion: 'Paciente no se presentó',
                actualizadoEn: ahora,
            },
        });

        // 4. Notificar a cada participante (fallo silencioso por cita)
        for (const cita of noShows) {
            await this._notificar(cita).catch(err =>
                console.error(`❌ AutoGestionCitasService: error notificando cita ${cita.id}:`, err)
            );
        }

        return noShows.length;
    }

    // Helper: Como la BD guarda las fechas combinadas (ej: 4:30 PM local = 16:30Z UTC naive),
    // debemos comparar 'ahora' usando el mismo criterio naive sobre la zona local (America/Santo_Domingo).
    private _obtenerAhoraLocalComoUTC(): Date {
        const d = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Santo_Domingo',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        });
        const parts = formatter.formatToParts(d);
        const p: Record<string, string> = {};
        for (const part of parts) {
            if (part.type !== 'literal') p[part.type] = part.value;
        }

        // El formato de hora "24:00" en algunos motores significa "00:00" del día siguiente; 
        // hour12: false suele dar '24' para la medianoche en Node.js antiguo, lo tratamos.
        let hour = p.hour;
        if (hour === '24') hour = '00';

        const fechaIsoNaive = `${p.year}-${p.month}-${p.day}T${hour}:${p.minute}:${p.second}.000Z`;
        return new Date(fechaIsoNaive);
    }

    private async _notificar(cita: any): Promise<void> {
        const base = {
            tipoEntidad: 'Cita' as const,
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
