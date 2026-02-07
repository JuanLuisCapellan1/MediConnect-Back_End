/**
 * Interfaz del Repositorio para TipoServicio
 */
import { TipoServicio } from '../entities/TipoServicio';
import {
  CrearTipoServicioDto,
  ActualizarTipoServicioDto,
  FiltroTiposServiciosDto,
} from '../../application/dtos/TipoServicioDtos';

export interface ITipoServicioRepository {
  crear(datos: CrearTipoServicioDto): Promise<TipoServicio>;
  obtenerPorId(id: number): Promise<TipoServicio | null>;
  obtenerTodas(
    filtros: FiltroTiposServiciosDto
  ): Promise<{ datos: TipoServicio[]; total: number }>;
  actualizar(
    id: number,
    datos: ActualizarTipoServicioDto
  ): Promise<TipoServicio>;
  eliminar(id: number): Promise<void>;
  existeNombre(nombre: string, excluirId?: number): Promise<boolean>;
}
