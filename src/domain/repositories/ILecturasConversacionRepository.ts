import { LecturaConversacion } from '../entities/LecturaConversacion';
import { MarcarMensajesLeidosDto } from '../../application/dtos/MensajeDtos';

export interface ILecturasConversacionRepository {
  crear(lectura: LecturaConversacion): Promise<LecturaConversacion>;
  obtenerPorConversacionYUsuario(conversacionId: number, usuarioId: number): Promise<LecturaConversacion | null>;
  actualizarUltimoMensajeLeido(dto: MarcarMensajesLeidosDto): Promise<LecturaConversacion>;
  obtenerMensajesNoLeidosPorUsuario(usuarioId: number): Promise<Map<number, number>>; // Map<conversacionId, cantidadNoLeidos>
  eliminarPorConversacion(conversacionId: number): Promise<boolean>;
}
