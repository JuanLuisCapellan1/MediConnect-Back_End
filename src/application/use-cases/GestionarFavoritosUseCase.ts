/**
 * GestionarFavoritosUseCase.ts
 * Casos de uso para que un paciente gestione sus doctores favoritos.
 */
import { DoctorFavorito } from '../../domain/entities/DoctorFavorito';
import { IFavoritoRepository } from '../../domain/repositories/IFavoritoRepository';
import { IDoctorRepository } from '../../domain/repositories/IDoctorRepository';

export class GestionarFavoritosUseCase {
    constructor(
        private readonly favoritoRepository: IFavoritoRepository,
        private readonly doctorRepository: IDoctorRepository
    ) { }

    /**
     * Agrega un doctor a la lista de favoritos del paciente.
     * Lanza error si el doctor no existe o ya es favorito.
     */
    async agregar(pacienteId: number, doctorId: number): Promise<DoctorFavorito> {
        const doctor = await this.doctorRepository.obtenerPorId(doctorId);
        if (!doctor) {
            throw new Error(`El doctor con ID ${doctorId} no existe`);
        }

        const yaExiste = await this.favoritoRepository.existe(pacienteId, doctorId);
        if (yaExiste) {
            throw new Error('Este doctor ya está en tu lista de favoritos');
        }

        return this.favoritoRepository.agregar(pacienteId, doctorId);
    }

    /**
     * Elimina un doctor de la lista de favoritos del paciente.
     * Lanza error si no estaba en favoritos.
     */
    async eliminar(pacienteId: number, doctorId: number): Promise<void> {
        const existe = await this.favoritoRepository.existe(pacienteId, doctorId);
        if (!existe) {
            throw new Error('Este doctor no está en tu lista de favoritos');
        }

        return this.favoritoRepository.eliminar(pacienteId, doctorId);
    }

    /**
     * Lista todos los doctores favoritos del paciente con datos enriquecidos.
     */
    async listar(pacienteId: number): Promise<DoctorFavorito[]> {
        return this.favoritoRepository.listar(pacienteId);
    }
}
