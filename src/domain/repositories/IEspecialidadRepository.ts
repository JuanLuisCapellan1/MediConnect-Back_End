/**
 * Interfaz del Repositorio para Especialidad
 */
import { Especialidad } from '../entities/Especialidad';
import {
    CrearEspecialidadDto,
    ActualizarEspecialidadDto,
    FiltroEspecialidadesDto,
} from '../../application/dtos/EspecialidadDtos';

export interface IEspecialidadRepository {
    crear(datos: CrearEspecialidadDto): Promise<Especialidad>;
    obtenerPorId(id: number): Promise<Especialidad | null>;
    obtenerTodas(
        filtros: FiltroEspecialidadesDto
    ): Promise<{ datos: Especialidad[]; total: number }>;
    actualizar(
        id: number,
        datos: ActualizarEspecialidadDto
    ): Promise<Especialidad>;
    eliminar(id: number): Promise<void>;
    existeNombre(nombre: string, excluirId?: number): Promise<boolean>;
}
