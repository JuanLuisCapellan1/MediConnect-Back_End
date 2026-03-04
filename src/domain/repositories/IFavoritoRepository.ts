/**
 * IFavoritoRepository.ts — Puerto de dominio para Doctores Favoritos
 */
import { DoctorFavorito } from '../entities/DoctorFavorito';

export interface IFavoritoRepository {
    /** Agrega un doctor a favoritos del paciente */
    agregar(pacienteId: number, doctorId: number): Promise<DoctorFavorito>;

    /** Elimina un doctor de favoritos del paciente */
    eliminar(pacienteId: number, doctorId: number): Promise<void>;

    /** Lista todos los doctores favoritos de un paciente (con datos del doctor) */
    listar(pacienteId: number): Promise<DoctorFavorito[]>;

    /** Verifica si un doctor ya es favorito del paciente */
    existe(pacienteId: number, doctorId: number): Promise<boolean>;

    /** Obtiene el conjunto de doctorIds que son favoritos del paciente */
    obtenerDoctorIdsDePackient(pacienteId: number): Promise<Set<number>>;
}
