"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoGestionCitasService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const GRACE_MINUTOS = 15; // Minutos de gracia tras el fin de la cita
const CRON_EXPRESSION = '*/5 * * * *'; // Cada 5 minutos
class AutoGestionCitasService {
    constructor(prisma, enviarNotifUC) {
        this.prisma = prisma;
        this.enviarNotifUC = enviarNotifUC;
    }
    iniciar() {
        console.log('⏰ AutoGestionCitasService: cron iniciado (cada 5 min).');
        node_cron_1.default.schedule(CRON_EXPRESSION, async () => {
            try {
                await this._procesarEnCurso();
                await this._procesarNoShows();
            }
            catch (err) {
                console.error('❌ AutoGestionCitasService: error en ciclo:', err);
            }
        });
    }
    async ejecutarAhora() {
        await this._procesarEnCurso();
        return this._procesarNoShows();
    }
    async _procesarEnCurso() {
        const ahoraNaive = this._obtenerAhoraLocalComoUTC();
        const candidatas = await this.prisma.cita.findMany({
            where: {
                estado: { in: ['Programada', 'Reprogramada'] },
                modalidad: 'Presencial',
                fechaInicio: { lte: ahoraNaive },
                historial: null,
            },
            select: { id: true },
        });
        if (candidatas.length === 0)
            return 0;
        const ids = candidatas.map((c) => c.id);
        console.log(`⏰ AutoGestionCitasService: ${ids.length} presenciales → 'En curso' [${ids.join(', ')}]`);
        await this.prisma.cita.updateMany({
            where: { id: { in: ids } },
            data: {
                estado: 'En curso',
                actualizadoEn: new Date(), // <-- UTC real para auditoría correcta
            },
        });
        return ids.length;
    }
    async _procesarNoShows() {
        const ahoraNaive = this._obtenerAhoraLocalComoUTC();
        const candidatas = await this.prisma.cita.findMany({
            where: {
                historial: null,
                OR: [
                    { modalidad: 'Presencial', estado: 'En curso' },
                    { modalidad: { not: 'Presencial' }, estado: { in: ['Programada', 'En curso'] } },
                ],
            },
            include: {
                servicio: { select: { duracionMinutos: true } },
            },
        });
        const noShows = candidatas.filter((c) => {
            const duracion = c.servicio?.duracionMinutos ?? 30;
            const fechaFin = new Date(c.fechaInicio.getTime() + duracion * 60000);
            const limite = new Date(fechaFin.getTime() + GRACE_MINUTOS * 60000);
            return ahoraNaive >= limite;
        });
        if (noShows.length === 0)
            return 0;
        const ids = noShows.map((c) => c.id);
        console.log(`⏰ AutoGestionCitasService: ${noShows.length} citas sin diagnóstico → cancelando [${ids.join(', ')}]`);
        await this.prisma.cita.updateMany({
            where: { id: { in: ids } },
            data: {
                estado: 'Cancelada',
                motivoCancelacion: 'Paciente no se presentó',
                actualizadoEn: new Date(), // <-- UTC real para auditoría
            },
        });
        for (const cita of noShows) {
            await this._notificar(cita).catch(err => console.error(`❌ Error notificando cita ${cita.id}:`, err));
        }
        return noShows.length;
    }
    /**
     * Devuelve la hora local naive usando matemática pura (UTC-4)
     * Esto evita bugs en servidores Linux que no tienen soporte Intl completo.
     */
    _obtenerAhoraLocalComoUTC() {
        // República Dominicana siempre es UTC-4
        const offsetMs = 4 * 60 * 60 * 1000;
        return new Date(Date.now() - offsetMs);
    }
    async _notificar(cita) {
        const base = { tipoEntidad: 'Cita', entidadId: cita.id };
        if (cita.doctorUsuarioId) {
            await this.enviarNotifUC.execute({
                ...base,
                usuarioId: cita.doctorUsuarioId,
                titulo: 'Cita cancelada por inasistencia',
                mensaje: `El paciente no se presentó a la cita #${cita.id}. Ha sido cancelada automáticamente.`,
                tipoAlerta: 'Advertencia',
            });
        }
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
