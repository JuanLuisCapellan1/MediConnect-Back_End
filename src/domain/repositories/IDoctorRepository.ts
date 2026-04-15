import { Doctor } from '../entities/Doctor';
import { ActualizarDoctorDto, FiltroDoctoresDto, FiltroDoctoresCercania } from '../../application/dtos/DoctorDtos';

export interface IDoctorRepository {
    obtenerPorId(id: number): Promise<Doctor | null>;
    obtenerPorUsuarioId(usuarioId: number): Promise<Doctor | null>;
    obtenerPerfilCompleto(usuarioId: number): Promise<any | null>;
    obtenerTodos(filtros: FiltroDoctoresDto): Promise<{ datos: Doctor[]; total: number }>;
    compararDoctores(ids: number[]): Promise<any[]>;
    actualizar(usuarioId: number, datos: ActualizarDoctorDto): Promise<Doctor>;
    eliminar(usuarioId: number): Promise<void>;
    existePorExequatur(exequatur: string, excluirUsuarioId?: number): Promise<boolean>;
    existePorDocumento(numeroDocumento: string, excluirUsuarioId?: number): Promise<boolean>;
    buscarCercanos(lat?: number, lng?: number, radioKm?: number, filtros?: FiltroDoctoresCercania, pacienteId?: number, centroId?: number): Promise<any[]>;
}

