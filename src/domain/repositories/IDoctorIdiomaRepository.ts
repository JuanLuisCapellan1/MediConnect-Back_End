import { DoctorIdioma } from '../entities/DoctorIdioma';
import { AgregarIdiomaDto, ActualizarIdiomaDto } from '../../application/dtos/DoctorDtos';

export interface IDoctorIdiomaRepository {
    agregar(doctorId: number, dto: AgregarIdiomaDto): Promise<DoctorIdioma>;
    obtenerPorId(id: number): Promise<DoctorIdioma | null>;
    obtenerPorDoctorId(doctorId: number): Promise<DoctorIdioma[]>;
    actualizar(id: number, dto: ActualizarIdiomaDto): Promise<DoctorIdioma>;
    eliminar(id: number): Promise<void>;
}
