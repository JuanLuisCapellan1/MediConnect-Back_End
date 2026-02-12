import { Doctor } from '../entities/Doctor';
import { ActualizarDoctorDto, FiltroDoctoresDto } from '../../application/dtos/DoctorDtos';

export interface IDoctorRepository {
    obtenerPorId(id: number): Promise<Doctor | null>;
    obtenerPorUsuarioId(usuarioId: number): Promise<Doctor | null>;
    obtenerTodos(filtros: FiltroDoctoresDto): Promise<{ datos: Doctor[]; total: number }>;
    actualizar(usuarioId: number, datos: ActualizarDoctorDto): Promise<Doctor>;
    eliminar(usuarioId: number): Promise<void>;
    existePorExequatur(exequatur: string, excluirUsuarioId?: number): Promise<boolean>;
    existePorDocumento(numeroDocumento: string, excluirUsuarioId?: number): Promise<boolean>;
}
