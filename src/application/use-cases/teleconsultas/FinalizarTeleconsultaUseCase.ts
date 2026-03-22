import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { ICitaRepository } from '../../../domain/repositories/ICitaRepository';
import { IVideoService } from '../../interfaces/IVideoService';
import { EnviarNotificacionUseCase } from '../notificaciones/EnviarNotificacionUseCase';

@injectable()
export class FinalizarTeleconsultaUseCase {

    constructor(
        @inject('CitaRepository') private readonly citaRepo: ICitaRepository,
        @inject('VideoService') private readonly videoService: IVideoService,
        @inject('PrismaClient') private readonly prisma: PrismaClient,
        @inject(EnviarNotificacionUseCase) private readonly enviarNotifUC: EnviarNotificacionUseCase,
    ) { }

    async ejecutar(citaId: number, usuarioId: number): Promise<{
        mensaje: string;
        duracionMinutos: number;
    }> {
        // ─── 1. Verificar que la cita existe ──────────────────────────────────
        const cita = await this.citaRepo.buscarPorId(citaId);
        if (!cita) {
            throw new Error(`Cita con ID ${citaId} no encontrada.`);
        }

        // ─── 2. Validar que el usuario es el doctor o el paciente de la cita ──
        const esDoctorDeCita = cita.doctorUsuarioId === usuarioId;
        const esPacienteDeCita = cita.pacienteId === usuarioId;

        if (!esDoctorDeCita && !esPacienteDeCita) {
            throw new Error('No tienes permisos para finalizar esta teleconsulta.');
        }

        // ─── 3. Buscar el LogTeleconsulta activo (estado 'Iniciada') ──────────
        const log = await this.prisma.logTeleconsulta.findFirst({
            where: { citaId, estado: 'Iniciada' },
            orderBy: { inicio: 'desc' },
        });

        if (!log) {
            throw new Error(
                `No existe una teleconsulta activa para la cita ${citaId}. ` +
                `Solo se puede finalizar una teleconsulta en estado 'Iniciada'.`
            );
        }

        // ─── 4. Calcular duración ─────────────────────────────────────────────
        const fechaFin = new Date();
        const duracionMs = fechaFin.getTime() - log.inicio.getTime();
        const duracionMinutos = Math.max(1, Math.ceil(duracionMs / 60_000));

        // ─── 5. Actualizar LogTeleconsulta ───────────────────────────────────
        await this.prisma.logTeleconsulta.update({
            where: { id: log.id },
            data: { fin: fechaFin, duracionMinutos, estado: 'Finalizada' },
        });

        // ─── 6. Cita queda 'En curso' hasta que el doctor diagnostique ────────
        // GUARD: si ya está Completada (el doctor ya diagnosticó antes de finalizar
        // la llamada), NO sobrescribir el estado.
        if (cita.estado !== 'Completada') {
            await this.citaRepo.actualizar(citaId, { estado: 'En curso' } as any);
        }


        // ─── 7. Destruir sala en Daily.co (fire-and-forget) ───────────────────
        if (log.salaReunion) {
            await this.videoService.eliminarSala(log.salaReunion);
        }

        // ─── 8. Notificar al otro participante ────────────────────────────────
        // Si el doctor cuelga → notificar al paciente (y viceversa)
        try {
            const destinatarioId = esDoctorDeCita ? cita.pacienteId : cita.doctorUsuarioId;
            await this.enviarNotifUC.execute({
                usuarioId: destinatarioId,
                titulo: 'Teleconsulta Finalizada',
                mensaje: `La videollamada ha terminado. Duración: ${duracionMinutos} minuto(s).`,
                tipoAlerta: 'Informacion',
                tipoEntidad: 'Teleconsulta',
                entidadId: citaId,
            });
        } catch (notifErr) {
            console.error('FinalizarTeleconsultaUseCase: error al notificar:', notifErr);
        }

        // ─── 9. Retornar resultado ────────────────────────────────────────────
        return {
            mensaje: `Teleconsulta finalizada. Duración: ${duracionMinutos} minuto(s).`,
            duracionMinutos,
        };
    }
}
