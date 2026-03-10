import { injectable, inject } from 'tsyringe';
import { ISolicitudAlianzaRepository } from '../../domain/repositories/ISolicitudAlianzaRepository';
import { ICentroSaludRepository } from '../../domain/repositories/ICentroSaludRepository';
import { CrearSolicitudAlianzaDto, ResponderSolicitudAlianzaDto } from '../dtos/SolicitudAlianzaDto';
import { EnviarNotificacionUseCase } from './notificaciones/EnviarNotificacionUseCase';

@injectable()
export class GestionarSolicitudesAlianzaUseCase {
    constructor(
        @inject('SolicitudAlianzaRepository') private solicitudRepo: ISolicitudAlianzaRepository,
        @inject('CentroSaludRepository') private centroRepo: ICentroSaludRepository,
        @inject(EnviarNotificacionUseCase) private enviarNotifUC: EnviarNotificacionUseCase,
    ) { }

    /**
     * Enviar solicitud de alianza.
     * rol = 'CentroSalud' → el centro le envía una solicitud a un doctor
     * rol = 'Doctor'      → el doctor le envía una solicitud a un centro
     */
    async enviarSolicitud(
        remitenteId: number,
        rol: 'Doctor' | 'CentroSalud',
        dto: CrearSolicitudAlianzaDto
    ): Promise<any> {
        const doctorId = rol === 'Doctor' ? remitenteId : dto.destinatarioId;
        const centroSaludId = rol === 'CentroSalud' ? remitenteId : dto.destinatarioId;
        const iniciadaPor = rol === 'Doctor' ? 'Doctor' : 'Centro';

        // Validar que el centro de salud destinatario existe
        const centro = await this.centroRepo.obtenerPorId(centroSaludId);
        if (!centro) {
            throw new Error(`El centro de salud con ID ${centroSaludId} no existe o no está activo.`);
        }

        // Validar que no exista una relación activa (Pendiente o Aceptada)
        const existente = await this.solicitudRepo.buscarExistente(doctorId, centroSaludId);
        if (existente) {
            if (existente.estado === 'Aceptada') {
                throw new Error('Ya existe una alianza activa entre este doctor y este centro');
            }
            if (existente.estado === 'Pendiente') {
                throw new Error('Ya existe una solicitud de alianza pendiente entre este doctor y este centro');
            }
        }

        const solicitud = await this.solicitudRepo.crear({
            doctorId,
            centroSaludId,
            mensaje: dto.mensaje,
            iniciadaPor,
        });

        // ─ Notificar al DESTINATARIO ─────────────────────────────────────────
        // Si el doctor inicia → notificar al usuarioId del Centro de Salud
        // Si el centro inicia → notificar al doctor
        const destinatarioId = rol === 'Doctor' ? centroSaludId : doctorId;
        this.enviarNotifUC.execute({
            usuarioId: destinatarioId,
            titulo: 'Nueva Solicitud de Alianza',
            mensaje: 'Has recibido una nueva solicitud de alianza médica.',
            tipoAlerta: 'Informacion',
            tipoEntidad: 'Alianza',
            entidadId: solicitud.id,
        }).catch((e: any) => console.error('notif enviarSolicitud:', e));

        return solicitud;
    }

    /**
     * Listar solicitudes según el rol del usuario autenticado.
     */
    async listarSolicitudes(usuarioId: number, rol: 'Doctor' | 'CentroSalud'): Promise<any[]> {
        if (rol === 'CentroSalud') {
            return await this.solicitudRepo.listarPorCentro(usuarioId);
        }
        return await this.solicitudRepo.listarPorDoctor(usuarioId);
    }

    /**
     * Responder a una solicitud recibida.
     * Solo el DESTINATARIO puede responder (aceptar/rechazar).
     */
    async responderSolicitud(
        solicitudId: number,
        usuarioId: number,
        rol: 'Doctor' | 'CentroSalud',
        dto: ResponderSolicitudAlianzaDto
    ): Promise<any> {
        const solicitud = await this.solicitudRepo.buscarPorId(solicitudId);
        if (!solicitud) throw new Error('Solicitud de alianza no encontrada');

        if (solicitud.estado !== 'Pendiente') {
            throw new Error('Solo se pueden responder solicitudes en estado Pendiente');
        }

        // Validar que quien responde es el destinatario (no quien inició)
        if (rol === 'CentroSalud') {
            if (solicitud.centroSaludId !== usuarioId) {
                throw new Error('No tienes permisos para responder esta solicitud');
            }
            if (solicitud.iniciadaPor !== 'Doctor') {
                throw new Error('No puedes responder tus propias solicitudes');
            }
        } else {
            // Doctor
            if (solicitud.doctorId !== usuarioId) {
                throw new Error('No tienes permisos para responder esta solicitud');
            }
            if (solicitud.iniciadaPor !== 'Centro') {
                throw new Error('No puedes responder tus propias solicitudes');
            }
        }

        if (dto.estado === 'Rechazada' && !dto.motivoRechazo?.trim()) {
            throw new Error('El motivo de rechazo es requerido al rechazar una solicitud');
        }

        const solicitudActualizada = await this.solicitudRepo.actualizar(solicitudId, {
            estado: dto.estado,
            motivoRechazo: dto.estado === 'Rechazada' ? dto.motivoRechazo : null,
        });

        // ─ Notificar al REMITENTE sobre el resultado ─────────────────────────
        const remitenteId = rol === 'CentroSalud' ? solicitud.doctorId : solicitud.centroSaludId;
        const accion = dto.estado === 'Aceptada' ? 'aprobada' : 'rechazada';
        this.enviarNotifUC.execute({
            usuarioId: remitenteId,
            titulo: 'Respuesta a Solicitud de Alianza',
            mensaje: `Tu solicitud de alianza ha sido ${accion}.`,
            tipoAlerta: 'Informacion',
            tipoEntidad: 'Alianza',
            entidadId: solicitudId,
        }).catch((e: any) => console.error('notif responderSolicitud:', e));

        return solicitudActualizada;
    }
}
