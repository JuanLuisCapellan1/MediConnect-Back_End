import { Mensaje } from '../entities/Mensaje';
import { 
  FiltroMensajesDto, 
  MensajeConRemitenteDto 
} from '../../application/dtos/MensajeDtos';

export interface IMensajesRepository {
  crear(mensaje: Mensaje): Promise<Mensaje>;
  obtenerPorId(id: number): Promise<Mensaje | null>;
  obtenerPorConversacion(filtros: FiltroMensajesDto): Promise<MensajeConRemitenteDto[]>;
  actualizar(id: number, mensaje: Partial<Mensaje>): Promise<Mensaje | null>;
  eliminar(id: number, remitenteId: number): Promise<boolean>;
  contarPorConversacion(conversacionId: number): Promise<number>;
  contarNoLeidosPorConversacion(conversacionId: number, usuarioId: number): Promise<number>;
  obtenerUltimoPorConversacion(conversacionId: number): Promise<Mensaje | null>;
  buscarEnConversacion(conversacionId: number, busqueda: string, limite?: number): Promise<MensajeConRemitenteDto[]>;
}
