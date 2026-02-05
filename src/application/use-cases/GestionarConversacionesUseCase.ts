import { injectable, inject } from 'tsyringe';
import { IConversacionesRepository } from '../../domain/repositories/IConversacionesRepository';
import { ILecturasConversacionRepository } from '../../domain/repositories/ILecturasConversacionRepository';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { Conversacion } from '../../domain/entities/Conversacion';
import { LecturaConversacion } from '../../domain/entities/LecturaConversacion';
import {
  CrearConversacionDto,
  ActualizarConversacionDto,
  FiltroConversacionesDto,
  ConversacionConUltimoMensajeDto
} from '../dtos/ConversacionDtos';
import { ConversacionYaExisteError } from '../../domain/errors/Conversaciones/ConversacionYaExisteError';
import { ConversacionNoEncontradaError } from '../../domain/errors/Conversaciones/ConversacionNoEncontradaError';
import { AccesoConversacionDenegadoError } from '../../domain/errors/Conversaciones/AccesoConversacionDenegadoError';
import { UsuarioNoEncontradoError } from '../../domain/errors/Conversaciones/UsuarioNoEncontradoError';
import { ConversacionMismoUsuarioError } from '../../domain/errors/Conversaciones/ConversacionMismoUsuarioError';
import { ConversacionNoPermitidaEntreRolesError } from '../../domain/errors/Conversaciones/ConversacionNoPermitidaEntreRolesError';

export interface ResultadoConversaciones {
  conversaciones: ConversacionConUltimoMensajeDto[];
  total: number;
  totalNoLeidos: number;
}

@injectable()
export class GestionarConversacionesUseCase {
  constructor(
    @inject('ConversacionesRepository')
    private conversacionesRepository: IConversacionesRepository,
    @inject('LecturasConversacionRepository')
    private lecturasRepository: ILecturasConversacionRepository,
    @inject('UsuarioRepository')
    private usuarioRepository: IUsuarioRepository
  ) {}

  /**
   * Crea una nueva conversación entre dos usuarios
   */
  async crear(dto: CrearConversacionDto): Promise<Conversacion> {
    // Validación: No permitir conversación con el mismo usuario
    if (dto.emisorId === dto.receptorId) {
      throw new ConversacionMismoUsuarioError(dto.emisorId);
    }

    // Verificar que ambos usuarios existen
    const [emisor, receptor] = await Promise.all([
      this.usuarioRepository.buscarPorId(dto.emisorId),
      this.usuarioRepository.buscarPorId(dto.receptorId)
    ]);

    if (!emisor) {
      throw new UsuarioNoEncontradoError(dto.emisorId);
    }

    if (!receptor) {
      throw new UsuarioNoEncontradoError(dto.receptorId);
    }

    // Validación: Verificar que los roles permiten crear conversación
    this.validarRolesPermitidos(emisor.rol, receptor.rol);

    // Verificar si ya existe una conversación activa entre estos usuarios
    const conversacionExistente = await this.conversacionesRepository.obtenerPorUsuarios(
      dto.emisorId,
      dto.receptorId
    );

    if (conversacionExistente && conversacionExistente.esActiva()) {
      throw new ConversacionYaExisteError(dto.emisorId, dto.receptorId);
    }

    // Si existe pero está archivada o bloqueada, reactivarla
    if (conversacionExistente) {
      conversacionExistente.desarchivar();
      conversacionExistente.desbloquear();
      const conversacionActualizada = await this.conversacionesRepository.actualizar(
        conversacionExistente.id,
        conversacionExistente
      );
      
      if (!conversacionActualizada) {
        throw new Error('Error al reactivar la conversación');
      }

      return conversacionActualizada;
    }

    // Crear nueva conversación
    const nuevaConversacion = new Conversacion(
      0, // ID será asignado por la base de datos
      dto.emisorId,
      dto.receptorId
    );

    const conversacionCreada = await this.conversacionesRepository.crear(nuevaConversacion);

    // Crear registros de lectura para ambos usuarios
    const lecturaEmisor = new LecturaConversacion(
      conversacionCreada.id,
      dto.emisorId,
      undefined
    );
    const lecturaReceptor = new LecturaConversacion(
      conversacionCreada.id,
      dto.receptorId,
      undefined
    );

    await Promise.all([
      this.lecturasRepository.crear(lecturaEmisor),
      this.lecturasRepository.crear(lecturaReceptor)
    ]);

    return conversacionCreada;
  }

  /**
   * Obtiene todas las conversaciones de un usuario
   */
  async obtenerPorUsuario(filtros: FiltroConversacionesDto): Promise<ResultadoConversaciones> {
    const conversaciones = await this.conversacionesRepository.obtenerPorUsuario(filtros);

    // Calcular total de mensajes no leídos
    const totalNoLeidos = conversaciones.reduce(
      (sum, conv) => sum + conv.mensajesNoLeidos,
      0
    );

    return {
      conversaciones,
      total: conversaciones.length,
      totalNoLeidos
    };
  }

  /**
   * Obtiene una conversación por ID
   */
  async obtenerPorId(id: number, usuarioId: number): Promise<ConversacionConUltimoMensajeDto> {
    const conversacion = await this.conversacionesRepository.obtenerConUltimoMensaje(id, usuarioId);

    if (!conversacion) {
      throw new ConversacionNoEncontradaError(id);
    }

    return conversacion;
  }

  /**
   * Actualiza una conversación (silenciar, archivar, etc.)
   */
  async actualizar(id: number, usuarioId: number, dto: ActualizarConversacionDto): Promise<Conversacion> {
    const conversacion = await this.conversacionesRepository.obtenerPorId(id);

    if (!conversacion) {
      throw new ConversacionNoEncontradaError(id);
    }

    // Verificar que el usuario sea participante
    if (!conversacion.esParticipante(usuarioId)) {
      throw new AccesoConversacionDenegadoError(id, usuarioId);
    }

    // Aplicar actualizaciones
    if (dto.silenciado !== undefined) {
      conversacion.silenciar(dto.silenciado);
    }

    if (dto.estado) {
      switch (dto.estado) {
        case 'Archivada':
          conversacion.archivar();
          break;
        case 'Bloqueada':
          conversacion.bloquear();
          break;
        case 'Activa':
          conversacion.desarchivar();
          conversacion.desbloquear();
          break;
      }
    }

    const conversacionActualizada = await this.conversacionesRepository.actualizar(
      id,
      conversacion
    );

    if (!conversacionActualizada) {
      throw new Error('Error al actualizar la conversación');
    }

    return conversacionActualizada;
  }

  /**
   * Elimina una conversación
   */
  async eliminar(id: number, usuarioId: number): Promise<void> {
    const conversacion = await this.conversacionesRepository.obtenerPorId(id);

    if (!conversacion) {
      throw new ConversacionNoEncontradaError(id);
    }

    // Verificar que el usuario sea participante
    if (!conversacion.esParticipante(usuarioId)) {
      throw new AccesoConversacionDenegadoError(id, usuarioId);
    }

    const eliminada = await this.conversacionesRepository.eliminar(id, usuarioId);

    if (!eliminada) {
      throw new Error('Error al eliminar la conversación');
    }
  }

  /**
   * Obtiene el conteo total de conversaciones de un usuario
   */
  async contarPorUsuario(usuarioId: number): Promise<number> {
    return await this.conversacionesRepository.contarPorUsuario(usuarioId);
  }

  /**
   * Obtiene o crea una conversación entre dos usuarios
   */
  async obtenerOCrear(emisorId: number, receptorId: number): Promise<Conversacion> {
    // Buscar conversación existente
    const conversacionExistente = await this.conversacionesRepository.obtenerPorUsuarios(
      emisorId,
      receptorId
    );

    if (conversacionExistente) {
      // Si está archivada o bloqueada, reactivarla
      if (!conversacionExistente.esActiva()) {
        conversacionExistente.desarchivar();
        conversacionExistente.desbloquear();
        const actualizada = await this.conversacionesRepository.actualizar(
          conversacionExistente.id,
          conversacionExistente
        );
        return actualizada || conversacionExistente;
      }
      return conversacionExistente;
    }

    // Crear nueva conversación
    return await this.crear({ emisorId, receptorId });
  }

  /**
   * Valida que los roles de los usuarios permitan crear una conversación
   * Combinaciones permitidas:
   * - Doctor ↔ Paciente
   * - Centro de Salud ↔ Doctor
   * - Paciente ↔ Centro de Salud
   */
  private validarRolesPermitidos(rolEmisor: string, rolReceptor: string): void {
    const combinacionesPermitidas = [
      // Doctor - Paciente
      { rol1: 'Doctor', rol2: 'Paciente' },
      { rol1: 'Paciente', rol2: 'Doctor' },
      
      // Centro de Salud - Doctor
      { rol1: 'Centro de Salud', rol2: 'Doctor' },
      { rol1: 'Doctor', rol2: 'Centro de Salud' },
      
      // Paciente - Centro de Salud
      { rol1: 'Paciente', rol2: 'Centro de Salud' },
      { rol1: 'Centro de Salud', rol2: 'Paciente' }
    ];

    const esPermitida = combinacionesPermitidas.some(
      combinacion => 
        (combinacion.rol1 === rolEmisor && combinacion.rol2 === rolReceptor) ||
        (combinacion.rol1 === rolReceptor && combinacion.rol2 === rolEmisor)
    );

    if (!esPermitida) {
      throw new ConversacionNoPermitidaEntreRolesError(rolEmisor, rolReceptor);
    }
  }
}
