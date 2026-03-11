import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { ICitaRepository } from '../../../domain/repositories/ICitaRepository';
import { IConversacionesRepository } from '../../../domain/repositories/IConversacionesRepository';
import { IVideoService } from '../../interfaces/IVideoService';
import { EnviarNotificacionUseCase } from '../notificaciones/EnviarNotificacionUseCase';

@injectable()
export class IniciarTeleconsultaUseCase {

    /** Minutos antes del inicio programado en que se puede abrir la sala. */
    private readonly VENTANA_ANTES_MINUTOS = 15;

    constructor(
        @inject('CitaRepository') private readonly citaRepo: ICitaRepository,
        @inject('ConversacionesRepository') private readonly conversacionesRepo: IConversacionesRepository,
        @inject('VideoService') private readonly videoService: IVideoService,
        @inject('PrismaClient') private readonly prisma: PrismaClient,
        @inject(EnviarNotificacionUseCase) private readonly enviarNotifUC: EnviarNotificacionUseCase,
    ) { }

    async ejecutar(citaId: number, doctorId: number): Promise<{
        urlAcceso: string;
        logId: number;
    }> {
        // ─── 1. Buscar la cita ────────────────────────────────────────────────
        const cita = await this.citaRepo.buscarPorId(citaId);
        if (!cita) {
            throw new Error(`Cita con ID ${citaId} no encontrada.`);
        }

        // ─── 2. Verificar que el doctor autenticado sea el dueño de la cita ──
        if (cita.doctorUsuarioId !== doctorId) {
            throw new Error('No tienes permisos para iniciar esta teleconsulta.');
        }

        // ─── 3. Verificar que la cita esté en estado 'Programada' ────────────
        if (cita.estado !== 'Programada') {
            throw new Error(
                `Solo se puede iniciar una teleconsulta en estado 'Programada'. ` +
                `Estado actual: '${cita.estado}'.`
            );
        }

        // ─── 4. Validar ventana horaria ────────────────────────────────────────
        // Solo se bloquea si el doctor intenta abrir demasiado temprano.
        // Si la cita sigue en 'Programada' siempre se puede iniciar (el sistema
        // nunca la auto-completa), sin importar cuánto tiempo haya pasado.
        const ahora = new Date();
        const fechaInicio = new Date(cita.fechaInicio);
        const aperturaMs = fechaInicio.getTime() - this.VENTANA_ANTES_MINUTOS * 60_000;

        if (ahora.getTime() < aperturaMs) {
            const minutosRestantes = Math.ceil((aperturaMs - ahora.getTime()) / 60_000);
            throw new Error(
                `Aún no puedes iniciar la teleconsulta. ` +
                `Podrás hacerlo a partir de ${minutosRestantes} minuto(s) antes de la hora programada.`
            );
        }

        // ─── 5. Buscar o crear Conversacion entre doctor y paciente ───────────
        const pacienteId: number = cita.pacienteId;

        let conversacion = await this.conversacionesRepo.obtenerPorUsuarios(doctorId, pacienteId);
        if (!conversacion) {
            conversacion = await this.conversacionesRepo.obtenerPorUsuarios(pacienteId, doctorId);
        }
        if (!conversacion) {
            conversacion = await this.conversacionesRepo.crear({
                emisorId: doctorId,
                receptorId: pacienteId,
                estado: 'Activa',
            } as any);
        }

        const conversacionId: number = conversacion.id;

        // ─── 6. Crear la sala en Daily.co ─────────────────────────────────────
        const duracionMinutos: number = cita.servicio?.duracionMinutos ?? 30;

        const { urlAcceso, urlPaciente, nombreSala } = await this.videoService.crearSalaPrivada(
            citaId,
            duracionMinutos,
        );

        // ─── 7. Registrar LogTeleconsulta ─────────────────────────────────────
        const log = await this.prisma.logTeleconsulta.create({
            data: {
                citaId,
                conversacionId,
                inicio: ahora,
                salaReunion: nombreSala,
                urlPaciente,
                estado: 'Iniciada',
            } as any,
        });

        // ─── 8. Actualizar estado de la Cita a 'En curso' ────────────────────
        await this.citaRepo.actualizar(citaId, { estado: 'En curso' } as any);

        // ─── 9. Notificar al paciente en tiempo real ──────────────────────────
        // En el modelo Prisma, Paciente.usuarioId = @id, así que cita.pacienteId
        // es directamente el usuarioId del paciente — no necesitamos otra query.
        try {
            await this.enviarNotifUC.execute({
                usuarioId: pacienteId,
                titulo: '¡Llamada Entrante!',
                mensaje: `El doctor ha iniciado la videollamada. Úté al enlace para unirte: ${urlPaciente}`,
                tipoAlerta: 'Urgente',
                tipoEntidad: 'Teleconsulta',
                entidadId: citaId,
            });
        } catch (notifErr) {
            console.error('IniciarTeleconsultaUseCase: error al notificar al paciente:', notifErr);
        }

        // ─── 10. Retornar resultado ───────────────────────────────────────────
        return {
            urlAcceso,
            logId: log.id,
        };
    }
}
