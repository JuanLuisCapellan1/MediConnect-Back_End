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
                await this._procesarNoShows();
            } catch (err) {
                console.error('❌ AutoGestionCitasService: error en ciclo:', err);
            }
        });
    }

    // ── Ejecución manual (útil para testing) ─────────────────────────────────
    async ejecutarAhora(): Promise<number> {
        return this._procesarNoShows();
    }

    // ── Lógica principal ──────────────────────────────────────────────────────
    private async _procesarNoShows(): Promise<number> {
        const ahora = new Date();

        // 1. Obtener candidatas (estados posibles + sin historial)
        const candidatas = await (this.prisma.cita as any).findMany({
            where: {
                estado: { in: ['Programada', 'En curso'] },
                historial: null,        // sin diagnóstico
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
            return ahora >= limite;
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
