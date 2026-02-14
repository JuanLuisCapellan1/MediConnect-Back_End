import { inject, injectable } from 'tsyringe';
import { IPacienteRepository } from '../../domain/repositories/IPacienteRepository';
import { PacienteValidator } from '../../domain/validators/Pacientes/PacienteValidator';
import { EstadoValidator } from '../../domain/validators/Estados/EstadoValidator';
import { ActualizarPacienteDto, FiltroPacientesDto } from '../dtos/PacienteDtos';
import { Paciente } from '../../domain/entities/Paciente';
import { PacienteNoEncontradoError } from '../../domain/errors/Pacientes/PacienteNoEncontradoError';

@injectable()
export class GestionarPacientesUseCase {
    constructor(
        @inject('PacienteRepository')
        private pacienteRepository: IPacienteRepository,
        @inject(PacienteValidator)
        private validator: PacienteValidator,
        @inject(EstadoValidator)
        private estadoValidator: EstadoValidator
    ) { }

    async obtenerPorId(id: number): Promise<Paciente> {
        const paciente = await this.pacienteRepository.obtenerPorId(id);
        if (!paciente) {
            throw new PacienteNoEncontradoError(id);
        }
        return paciente;
    }

    async obtenerPorUsuarioId(usuarioId: number): Promise<Paciente> {
        const paciente = await this.pacienteRepository.obtenerPorUsuarioId(usuarioId);
        if (!paciente) {
            throw new PacienteNoEncontradoError(usuarioId);
        }
        return paciente;
    }

    async listar(filtros: FiltroPacientesDto): Promise<{ datos: Paciente[]; total: number }> {
        // Normalizar estado si existe
        if (filtros.estado) {
            filtros.estado = this.normalizarEstado(filtros.estado);
        }

        return await this.pacienteRepository.obtenerTodos(filtros);
    }

    async actualizar(usuarioId: number, dto: any): Promise<Paciente> {
        // Verificar que el paciente existe
        await this.obtenerPorUsuarioId(usuarioId);



        // Asegurar que fechaNacimiento sea Date si viene como string
        if (dto.fechaNacimiento && typeof dto.fechaNacimiento === 'string') {
            dto.fechaNacimiento = new Date(dto.fechaNacimiento);
        }

        return await this.pacienteRepository.actualizar(usuarioId, dto);
    }

    async eliminar(usuarioId: number): Promise<void> {
        // Verificar que el paciente existe
        await this.obtenerPorUsuarioId(usuarioId);

        await this.pacienteRepository.eliminar(usuarioId);
    }

    private normalizarEstado(estado: string): string {
        if (!estado) return estado;
        return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
    }
}
