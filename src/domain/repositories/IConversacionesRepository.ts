import { Conversacion } from '../entities/Conversacion';
import {
  FiltroConversacionesDto,
  ConversacionConUltimoMensajeDto
} from '../../application/dtos/ConversacionDtos';

export interface IConversacionesRepository {
  crear(conversacion: Conversacion): Promise<Conversacion>;
  obtenerPorId(id: number): Promise<Conversacion | null>;
  obtenerPorUsuarios(emisorId: number, receptorId: number): Promise<Conversacion | null>;
  obtenerPorUsuario(filtros: FiltroConversacionesDto): Promise<ConversacionConUltimoMensajeDto[]>;
  actualizar(id: number, conversacion: Partial<Conversacion>): Promise<Conversacion | null>;
  eliminar(id: number, usuarioId: number): Promise<boolean>;
  existeConversacionActiva(emisorId: number, receptorId: number): Promise<boolean>;
  contarPorUsuario(usuarioId: number): Promise<number>;
  obtenerConUltimoMensaje(id: number, usuarioId: number): Promise<ConversacionConUltimoMensajeDto | null>;
}
