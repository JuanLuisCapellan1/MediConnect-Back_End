import { TipoSeguro } from '../entities/TipoSeguro';
import {
    CrearTipoSeguroDto,
    ActualizarTipoSeguroDto,
    FiltroTiposSegurosDto,
} from '../../application/dtos/TipoSeguroDtos';

/**
 * Interfaz del Repositorio para Tipos de Seguros
 */
export interface ITipoSeguroRepository {
    // ============================================
    // Admin - CRUD completo
    // ============================================
    crear(datos: CrearTipoSeguroDto): Promise<TipoSeguro>;
    obtenerPorId(id: number): Promise<TipoSeguro | null>;
    obtenerTodos(filtros: FiltroTiposSegurosDto): Promise<{ datos: TipoSeguro[]; total: number }>;
    actualizar(id: number, datos: ActualizarTipoSeguroDto): Promise<TipoSeguro>;
    eliminar(id: number): Promise<void>;

    // ============================================
    // Cliente - Solo lectura
    // ============================================
    obtenerActivos(): Promise<TipoSeguro[]>;

    // ============================================
    // Utilidades
    // ============================================
    existeNombre(nombre: string, excluirId?: number): Promise<boolean>;
    verificarEnUso(id: number): Promise<boolean>;
}
