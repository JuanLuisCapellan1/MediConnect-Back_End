import { inject, injectable } from 'tsyringe';
import { IDoctorRepository } from '../../domain/repositories/IDoctorRepository';
import { DoctorValidator } from '../../domain/validators/Doctores/DoctorValidator';
import { EstadoValidator } from '../../domain/validators/Estados/EstadoValidator';
import { ActualizarDoctorDto, FiltroDoctoresDto } from '../dtos/DoctorDtos';
import { Doctor } from '../../domain/entities/Doctor';
import { DoctorNoEncontradoError } from '../../domain/errors/Doctores/DoctorNoEncontradoError';

@injectable()
export class GestionarDoctoresUseCase {
    constructor(
        @inject('DoctorRepository')
        private doctorRepository: IDoctorRepository,
        @inject(DoctorValidator)
        private validator: DoctorValidator,
        @inject(EstadoValidator)
        private estadoValidator: EstadoValidator
    ) { }

    async obtenerPorId(id: number): Promise<Doctor> {
        const doctor = await this.doctorRepository.obtenerPorId(id);
        if (!doctor) {
            throw new DoctorNoEncontradoError(id);
        }
        return doctor;
    }

    async obtenerPorUsuarioId(usuarioId: number): Promise<Doctor> {
        const doctor = await this.doctorRepository.obtenerPorUsuarioId(usuarioId);
        if (!doctor) {
            throw new DoctorNoEncontradoError(usuarioId);
        }
        return doctor;
    }

    async listar(filtros: FiltroDoctoresDto): Promise<{ datos: Doctor[]; total: number }> {
        // Normalizar estado si existe
        if (filtros.estado) {
            filtros.estado = this.normalizarEstado(filtros.estado);
        }

        // Normalizar estadoVerificacion si existe
        if (filtros.estadoVerificacion) {
            filtros.estadoVerificacion = this.normalizarEstado(filtros.estadoVerificacion);
        }

        return await this.doctorRepository.obtenerTodos(filtros);
    }

    async actualizar(usuarioId: number, dto: ActualizarDoctorDto): Promise<Doctor> {
        // Verificar que el doctor existe
        await this.obtenerPorUsuarioId(usuarioId);

        // Normalizar estado si existe
        if (dto.estado) {
            dto.estado = this.normalizarEstado(dto.estado);
        }

        // Validar campos únicos si se están actualizando
        // Nota: exequatur y numero_documento_identificacion NO deberían ser editables, pero validamos por seguridad
        await this.validator.validarActualizacion(usuarioId);

        return await this.doctorRepository.actualizar(usuarioId, dto);
    }

    async eliminar(usuarioId: number): Promise<void> {
        // Verificar que el doctor existe
        await this.obtenerPorUsuarioId(usuarioId);

        await this.doctorRepository.eliminar(usuarioId);
    }

    private normalizarEstado(estado: string): string {
        if (!estado) return estado;
        return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
    }
}
