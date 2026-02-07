/**
 * Interfaz del Repositorio para TipoCentroSalud
 */
import { TipoCentroSalud } from '../entities/TipoCentroSalud';
import {
  CrearTipoCentroSaludDto,
  ActualizarTipoCentroSaludDto,
  FiltroTiposCentrosSaludDto,
} from '../../application/dtos/TipoCentroSaludDtos';

export interface ITipoCentroSaludRepository {
  crear(datos: CrearTipoCentroSaludDto): Promise<TipoCentroSalud>;
  obtenerPorId(id: number): Promise<TipoCentroSalud | null>;
  obtenerTodos(
    filtros: FiltroTiposCentrosSaludDto
  ): Promise<{ datos: TipoCentroSalud[]; total: number }>;
  actualizar(
    id: number,
    datos: ActualizarTipoCentroSaludDto
  ): Promise<TipoCentroSalud>;
  eliminar(id: number): Promise<void>;
  existeNombre(nombre: string, excluirId?: number): Promise<boolean>;
}
