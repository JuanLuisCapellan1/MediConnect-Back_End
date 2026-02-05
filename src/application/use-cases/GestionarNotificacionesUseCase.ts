import { injectable, inject } from 'tsyringe';
import { INotificacionesRepository } from '../../domain/repositories/INotificacionesRepository';
import { Notificacion } from '../../domain/entities/Notificacion';
import {
  CrearNotificacionDto,
  FiltroNotificacionesDto,
  MarcarComoLeidaDto,
  MarcarVariasLeidasDto
} from '../dtos/NotificacionDtos';

export interface ResultadoPaginado {
  notificaciones: Notificacion[];
  total: number;
  noLeidas: number;
}

@injectable()
export class GestionarNotificacionesUseCase {
  constructor(
    @inject('NotificacionesRepository')
    private notificacionesRepository: INotificacionesRepository
  ) {}

  /**
   * Crea una nueva notificación
   */
  async crear(dto: CrearNotificacionDto): Promise<Notificacion> {
    // Validaciones básicas
    if (!dto.titulo || dto.titulo.trim().length === 0) {
      throw new Error('El título es obligatorio');
    }

    if (!dto.mensaje || dto.mensaje.trim().length === 0) {
      throw new Error('El mensaje es obligatorio');
    }

    if (dto.titulo.length > 100) {
      throw new Error('El título no puede exceder 100 caracteres');
    }

    const notificacion = new Notificacion(
      0, // El ID será asignado por la base de datos
      dto.usuarioId,
      dto.titulo,
      dto.mensaje,
      dto.tipoAlerta || 'Informacion',
      dto.tipoEntidad,
      dto.entidadId
    );

    return await this.notificacionesRepository.crear(notificacion);
  }

  /**
   * Obtiene las notificaciones de un usuario con filtros
   */
  async obtenerPorUsuario(filtros: FiltroNotificacionesDto): Promise<ResultadoPaginado> {
    const [notificaciones, noLeidas] = await Promise.all([
      this.notificacionesRepository.obtenerPorUsuario(filtros),
      this.notificacionesRepository.contarNoLeidas(filtros.usuarioId)
    ]);

    return {
      notificaciones,
      total: notificaciones.length,
      noLeidas
    };
  }

  /**
   * Obtiene una notificación por ID
   */
  async obtenerPorId(id: number, usuarioId: number): Promise<Notificacion> {
    const notificacion = await this.notificacionesRepository.obtenerPorId(id);

    if (!notificacion) {
      throw new Error('Notificación no encontrada');
    }

    // Verificar que la notificación pertenece al usuario
    if (notificacion.usuarioId !== usuarioId) {
      throw new Error('No tienes permiso para acceder a esta notificación');
    }

    return notificacion;
  }

  /**
   * Marca una notificación como leída
   */
  async marcarComoLeida(dto: MarcarComoLeidaDto): Promise<Notificacion> {
    const notificacion = await this.notificacionesRepository.marcarComoLeida(
      dto.notificacionId,
      dto.usuarioId
    );

    if (!notificacion) {
      throw new Error('Notificación no encontrada o no tienes permiso');
    }

    return notificacion;
  }

  /**
   * Marca varias notificaciones como leídas
   */
  async marcarVariasComoLeidas(dto: MarcarVariasLeidasDto): Promise<number> {
    if (!dto.notificacionesIds || dto.notificacionesIds.length === 0) {
      throw new Error('Debe proporcionar al menos una notificación');
    }

    return await this.notificacionesRepository.marcarVariasComoLeidas(
      dto.notificacionesIds,
      dto.usuarioId
    );
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   */
  async marcarTodasComoLeidas(usuarioId: number): Promise<number> {
    return await this.notificacionesRepository.marcarTodasComoLeidas(usuarioId);
  }

  /**
   * Cuenta las notificaciones no leídas de un usuario
   */
  async contarNoLeidas(usuarioId: number): Promise<number> {
    return await this.notificacionesRepository.contarNoLeidas(usuarioId);
  }

  /**
   * Elimina (desactiva) una notificación
   */
  async eliminar(id: number, usuarioId: number): Promise<boolean> {
    const resultado = await this.notificacionesRepository.eliminar(id, usuarioId);

    if (!resultado) {
      throw new Error('Notificación no encontrada o no tienes permiso');
    }

    return resultado;
  }

  /**
   * Elimina (desactiva) varias notificaciones
   */
  async eliminarVarias(ids: number[], usuarioId: number): Promise<number> {
    if (!ids || ids.length === 0) {
      throw new Error('Debe proporcionar al menos una notificación');
    }

    return await this.notificacionesRepository.eliminarVarias(ids, usuarioId);
  }
}
