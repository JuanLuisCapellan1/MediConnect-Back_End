import { injectable, inject } from 'tsyringe';
import { IMensajesRepository } from '../../domain/repositories/IMensajesRepository';
import { IConversacionesRepository } from '../../domain/repositories/IConversacionesRepository';
import { ILecturasConversacionRepository } from '../../domain/repositories/ILecturasConversacionRepository';
import { IMediaRepository } from '../../domain/repositories/IMediaRepository';
import { Mensaje } from '../../domain/entities/Mensaje';
import {
  CrearMensajeDto,
  ActualizarMensajeDto,
  FiltroMensajesDto,
  MarcarMensajesLeidosDto,
  MensajeConRemitenteDto
} from '../dtos/MensajeDtos';
import { MensajeNoEncontradoError } from '../../domain/errors/Mensajes/MensajeNoEncontradoError';
import { AccesoMensajeDenegadoError } from '../../domain/errors/Mensajes/AccesoMensajeDenegadoError';
import { MensajeInvalidoError } from '../../domain/errors/Mensajes/MensajeInvalidoError';
import { ConversacionNoEncontradaError } from '../../domain/errors/Conversaciones/ConversacionNoEncontradaError';
import { AccesoConversacionDenegadoError } from '../../domain/errors/Conversaciones/AccesoConversacionDenegadoError';

export interface ResultadoMensajes {
  mensajes: MensajeConRemitenteDto[];
  total: number;
  pagina: number;
  limite: number;
  hayMas: boolean;
}

@injectable()
export class GestionarMensajesUseCase {
  constructor(
    @inject('MensajesRepository')
    private mensajesRepository: IMensajesRepository,
    @inject('ConversacionesRepository')
    private conversacionesRepository: IConversacionesRepository,
    @inject('LecturasConversacionRepository')
    private lecturasRepository: ILecturasConversacionRepository,
    @inject('MediaRepository')
    private mediaRepository: IMediaRepository
  ) { }

  /**
   * Crea un nuevo mensaje en una conversación
   */
  async crear(dto: CrearMensajeDto): Promise<Mensaje> {
    // Verificar que la conversación existe
    const conversacion = await this.conversacionesRepository.obtenerPorId(dto.conversacionId);

    if (!conversacion) {
      throw new ConversacionNoEncontradaError(dto.conversacionId);
    }

    // Verificar que el remitente es participante de la conversación
    if (!conversacion.esParticipante(dto.remitenteId)) {
      throw new AccesoConversacionDenegadoError(dto.conversacionId, dto.remitenteId);
    }

    // Verificar que la conversación no esté bloqueada
    if (conversacion.esBloqueada()) {
      throw new Error('No puedes enviar mensajes en una conversación bloqueada');
    }

    // Si hay mediaId, verificar que el media existe
    if (dto.mediaId) {
      const media = await this.mediaRepository.obtenerPorId(dto.mediaId);
      if (!media || !media.esActivo()) {
        throw new Error('El archivo multimedia no existe o no está disponible');
      }
    }

    // Crear el mensaje
    const nuevoMensaje = new Mensaje(
      0, // ID será asignado por la base de datos
      dto.conversacionId,
      dto.remitenteId,
      dto.contenido,
      (dto.tipo || 'texto') as any,
      dto.mediaId,
      'Enviado'
    );

    // Validar que el mensaje sea válido
    if (!nuevoMensaje.esValido()) {
      throw new MensajeInvalidoError('El mensaje debe tener contenido de texto o un archivo adjunto');
    }

    const mensajeCreado = await this.mensajesRepository.crear(nuevoMensaje);

    // Actualizar el timestamp de la conversación (ya se hace en el repositorio)

    return mensajeCreado;
  }

  /**
   * Obtiene un mensaje con datos del remitente por su ID
   */
  async obtenerConRemitentesPorId(id: number): Promise<MensajeConRemitenteDto | null> {
    const repo = this.mensajesRepository as any;
    if (repo.obtenerConRemitentesPorId) {
      return await repo.obtenerConRemitentesPorId(id);
    }
    return null;
  }

  /**
   * Obtiene los mensajes de una conversación
   */
  async obtenerPorConversacion(filtros: FiltroMensajesDto): Promise<ResultadoMensajes> {
    return await this.mensajesRepository.obtenerPorConversacion(filtros);
  }

  /**
   * Obtiene un mensaje por ID
   */
  async obtenerPorId(id: number, usuarioId: number): Promise<Mensaje> {
    const mensaje = await this.mensajesRepository.obtenerPorId(id);

    if (!mensaje) {
      throw new MensajeNoEncontradoError(id);
    }

    // Verificar que el usuario tenga acceso a la conversación
    const conversacion = await this.conversacionesRepository.obtenerPorId(mensaje.conversacionId);

    if (!conversacion || !conversacion.esParticipante(usuarioId)) {
      throw new AccesoMensajeDenegadoError(id, usuarioId);
    }

    return mensaje;
  }

  /**
   * Edita un mensaje existente
   */
  async actualizar(id: number, usuarioId: number, dto: ActualizarMensajeDto): Promise<Mensaje> {
    const mensaje = await this.mensajesRepository.obtenerPorId(id);

    if (!mensaje) {
      throw new MensajeNoEncontradoError(id);
    }

    // Verificar que el usuario es el remitente
    if (!mensaje.fueEnviadoPor(usuarioId)) {
      throw new AccesoMensajeDenegadoError(id, usuarioId);
    }

    // No se puede editar un mensaje eliminado
    if (mensaje.fueEliminado()) {
      throw new Error('No se puede editar un mensaje eliminado');
    }

    // Actualizar contenido si se proporciona
    if (dto.contenido !== undefined) {
      mensaje.editar(dto.contenido);
    }

    const mensajeActualizado = await this.mensajesRepository.actualizar(id, mensaje);

    if (!mensajeActualizado) {
      throw new Error('Error al actualizar el mensaje');
    }

    return mensajeActualizado;
  }

  /**
   * Elimina un mensaje (soft delete)
   */
  async eliminar(id: number, usuarioId: number): Promise<void> {
    const mensaje = await this.mensajesRepository.obtenerPorId(id);

    if (!mensaje) {
      throw new MensajeNoEncontradoError(id);
    }

    // Verificar que el usuario es el remitente
    if (!mensaje.fueEnviadoPor(usuarioId)) {
      throw new AccesoMensajeDenegadoError(id, usuarioId);
    }

    const eliminado = await this.mensajesRepository.eliminar(id, usuarioId);

    if (!eliminado) {
      throw new Error('Error al eliminar el mensaje');
    }
  }

  /**
   * Marca mensajes como leídos hasta un mensaje específico
   */
  async marcarComoLeidos(dto: MarcarMensajesLeidosDto): Promise<void> {
    // Verificar que el usuario tenga acceso a la conversación
    const conversacion = await this.conversacionesRepository.obtenerPorId(dto.conversacionId);

    if (!conversacion || !conversacion.esParticipante(dto.usuarioId)) {
      throw new AccesoConversacionDenegadoError(dto.conversacionId, dto.usuarioId);
    }

    await this.lecturasRepository.actualizarUltimoMensajeLeido(dto);
  }

  /**
   * Cuenta mensajes no leídos en una conversación
   */
  async contarNoLeidos(conversacionId: number, usuarioId: number): Promise<number> {
    return await this.mensajesRepository.contarNoLeidosPorConversacion(conversacionId, usuarioId);
  }

  /**
   * Busca mensajes en una conversación
   */
  async buscar(conversacionId: number, usuarioId: number, busqueda: string): Promise<MensajeConRemitenteDto[]> {
    // Verificar acceso a la conversación
    const conversacion = await this.conversacionesRepository.obtenerPorId(conversacionId);

    if (!conversacion || !conversacion.esParticipante(usuarioId)) {
      throw new AccesoConversacionDenegadoError(conversacionId, usuarioId);
    }

    return await this.mensajesRepository.buscarEnConversacion(conversacionId, busqueda);
  }

  /**
   * Obtiene el último mensaje de una conversación
   */
  async obtenerUltimo(conversacionId: number, usuarioId: number): Promise<Mensaje | null> {
    // Verificar acceso
    const conversacion = await this.conversacionesRepository.obtenerPorId(conversacionId);

    if (!conversacion || !conversacion.esParticipante(usuarioId)) {
      throw new AccesoConversacionDenegadoError(conversacionId, usuarioId);
    }

    return await this.mensajesRepository.obtenerUltimoPorConversacion(conversacionId);
  }
}
