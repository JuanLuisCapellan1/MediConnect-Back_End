import { inject, injectable } from 'tsyringe';
import { IDoctorIdiomaRepository } from '../../domain/repositories/IDoctorIdiomaRepository';
import { DoctorIdioma } from '../../domain/entities/DoctorIdioma';
import { AgregarIdiomaDto, ActualizarIdiomaDto } from '../dtos/DoctorDtos';

@injectable()
export class GestionarDoctorIdiomasUseCase {
    constructor(
        @inject('DoctorIdiomaRepository')
        private doctorIdiomaRepository: IDoctorIdiomaRepository
    ) { }

    async agregar(doctorId: number, dto: AgregarIdiomaDto): Promise<DoctorIdioma> {
        return await this.doctorIdiomaRepository.agregar(doctorId, dto);
    }

    async obtenerPorDoctorId(doctorId: number): Promise<DoctorIdioma[]> {
        return await this.doctorIdiomaRepository.obtenerPorDoctorId(doctorId);
    }

    async obtenerPorId(id: number): Promise<DoctorIdioma | null> {
        return await this.doctorIdiomaRepository.obtenerPorId(id);
    }

    async actualizar(id: number, dto: ActualizarIdiomaDto): Promise<DoctorIdioma> {
        return await this.doctorIdiomaRepository.actualizar(id, dto);
    }

    async eliminar(id: number): Promise<void> {
        await this.doctorIdiomaRepository.eliminar(id);
    }
}
