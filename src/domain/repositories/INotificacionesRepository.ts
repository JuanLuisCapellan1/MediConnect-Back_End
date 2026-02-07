import { Notificacion } from '../entities/Notificacion';
import { FiltroNotificacionesDto } from '../../application/dtos/NotificacionDtos';

export interface INotificacionesRepository {
  crear(notificacion: Notificacion): Promise<Notificacion>;
  obtenerPorId(id: number): Promise<Notificacion | null>;
  obtenerPorUsuario(filtros: FiltroNotificacionesDto): Promise<Notificacion[]>;
  contarNoLeidas(usuarioId: number): Promise<number>;
  marcarComoLeida(id: number, usuarioId: number): Promise<Notificacion | null>;
  marcarVariasComoLeidas(ids: number[], usuarioId: number): Promise<number>;
  marcarTodasComoLeidas(usuarioId: number): Promise<number>;
  eliminar(id: number, usuarioId: number): Promise<boolean>;
  eliminarVarias(ids: number[], usuarioId: number): Promise<number>;
}
