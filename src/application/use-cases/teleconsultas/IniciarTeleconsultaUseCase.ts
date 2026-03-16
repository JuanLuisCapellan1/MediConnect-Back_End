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
        // ─── 3. Verificar que la cita esté en estado 'Programada' o 'En curso' ───
        if (cita.estado !== 'Programada' && cita.estado !== 'En curso') {
            throw new Error(
                `Solo se puede iniciar o retomar una teleconsulta en estado 'Programada' o 'En curso'. ` +
                `Estado actual: '${cita.estado}'.`
            );
        }

        // ─── 3.5 Si ya está "En curso", intentar retomar la sala activa ────────
        if (cita.estado === 'En curso') {
            const logActivo = await this.prisma.logTeleconsulta.findFirst({
                where: { citaId, estado: 'Iniciada' },
                orderBy: { creadoEn: 'desc' }
            });

            if (logActivo && logActivo.urlDoctor) {
                // Notificar de nuevo al paciente por si acaso se desconectó
                this._notificarPaciente(cita.pacienteId, logActivo.urlPaciente!, citaId);

                return {
                    urlAcceso: logActivo.urlDoctor,
                    logId: logActivo.id,
                };
            }
            // Si por algún motivo está "En curso" pero no hay log, seguimos el flujo para crear sala
        }

        // ─── 4. Validar ventana horaria ────────────────────────────────────────
        // Solo se bloquea si el doctor intenta abrir demasiado temprano.
        // Si la cita sigue en 'Programada' siempre se puede iniciar (el sistema
        // nunca la auto-completa), sin importar cuánto tiempo haya pasado.
        const ahora = new Date();
        const fechaInicio = new Date(cita.fechaInicio);
        const aperturaMs = fechaInicio.getTime() - this.VENTANA_ANTES_MINUTOS * 60_000;

        if (cita.estado === 'Programada' && ahora.getTime() < aperturaMs) {
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
                urlDoctor: urlAcceso,
                estado: 'Iniciada',
            } as any,
        });

        // ─── 8. Actualizar estado de la Cita a 'En curso' ────────────────────
        await this.citaRepo.actualizar(citaId, { estado: 'En curso' } as any);

        // ─── 9. Notificar al paciente en tiempo real ──────────────────────────
        this._notificarPaciente(pacienteId, urlPaciente, citaId);

        // ─── 10. Retornar resultado ───────────────────────────────────────────
        return {
            urlAcceso,
            logId: log.id,
        };
    }

    private async _notificarPaciente(pacienteId: number, urlPaciente: string, citaId: number): Promise<void> {
        try {
            await this.enviarNotifUC.execute({
                usuarioId: pacienteId,
                titulo: '¡Llamada Entrante!',
                mensaje: `¡Hola! El doctor ya se encuentra en la sala de espera virtual para su consulta. Por favor, acceda a la plataforma para iniciar la videollamada.`,
                tipoAlerta: 'Urgente',
                tipoEntidad: 'Teleconsulta',
                entidadId: citaId,
            });
        } catch (notifErr) {
            console.error('IniciarTeleconsultaUseCase: error al notificar al paciente:', notifErr);
        }
    }
}
