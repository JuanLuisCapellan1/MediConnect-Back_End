import { inject, injectable } from 'tsyringe';
import { ICondicionMedicaRepository } from '../../domain/repositories/ICondicionMedicaRepository';
import { CondicionMedicaValidator } from '../../domain/validators/CondicionesMedicas/CondicionMedicaValidator';
import {
    CrearCondicionMedicaDto,
    ActualizarCondicionMedicaDto,
    FiltroCondicionesMedicasDto,
    AsignarCondicionPacienteDto,
    ActualizarCondicionPacienteDto,
    FiltroCondicionesPacienteDto,
    AgregarAlergiaPersonalDto,
    CrearCondicionPersonalDto,
    ActualizarMiCondicionDto,
    FiltroMisCondicionesDto,
    BuscarAlergiasDto,
} from '../dtos/CondicionMedicaDtos';

import { CondicionMedicaNoEncontradaError } from '../../domain/errors/CondicionesMedicas/CondicionMedicaNoEncontradaError';
import { EstadoValidator } from '../../domain/validators/Estados/EstadoValidator';

@injectable()
export class GestionarCondicionesMedicasUseCase {
    constructor(
        @inject('CondicionMedicaRepository')
        private condicionMedicaRepository: ICondicionMedicaRepository,
        @inject(CondicionMedicaValidator)
        private validator: CondicionMedicaValidator,
        @inject(EstadoValidator)
        private estadoValidator: EstadoValidator
    ) { }

    async crear(dto: CrearCondicionMedicaDto) {
        // Normalizar tipo
        dto.tipo = this.normalizarTipo(dto.tipo);

        // Validar tipo
        await this.validarTipo(dto.tipo);

        // Validar nombre único
        await this.validator.validarCreacion(dto.nombre);

        return await this.condicionMedicaRepository.crear(dto);
    }

    async obtenerPorId(id: number) {
        const encontrado = await this.condicionMedicaRepository.obtenerPorId(id);
        if (!encontrado) {
            throw new CondicionMedicaNoEncontradaError(id);
        }
        return encontrado;
    }

    async listar(filtros: FiltroCondicionesMedicasDto) {
        if (filtros.estado) {
            filtros.estado = this.normalizarEstado(filtros.estado);
        }
        if (filtros.tipo) {
            filtros.tipo = this.normalizarTipo(filtros.tipo);
        }
        return await this.condicionMedicaRepository.obtenerTodas(filtros);
    }

    async actualizar(id: number, dto: ActualizarCondicionMedicaDto) {
        const existente = await this.condicionMedicaRepository.obtenerPorId(id);
        if (!existente) {
            throw new CondicionMedicaNoEncontradaError(id);
        }

        if (dto.nombre) {
            await this.validator.validarActualizacion(id, dto.nombre);
        }

        if (dto.tipo) {
            dto.tipo = this.normalizarTipo(dto.tipo);
            await this.validarTipo(dto.tipo);
        }

        if (dto.estado) {
            dto.estado = this.normalizarEstado(dto.estado);
            await this.estadoValidator.validarEstado(dto.estado, ['Activa', 'Inactiva', 'Eliminada']);
        }

        return await this.condicionMedicaRepository.actualizar(id, dto);
    }

    async eliminar(id: number) {
        const existente = await this.condicionMedicaRepository.obtenerPorId(id);
        if (!existente) {
            throw new CondicionMedicaNoEncontradaError(id);
        }
        return await this.condicionMedicaRepository.eliminar(id);
    }

    // Métodos para gestión de condiciones de pacientes
    async asignarAPaciente(dto: AsignarCondicionPacienteDto) {
        // Verificar que la condición existe
        const condicion = await this.condicionMedicaRepository.obtenerPorId(dto.condicionId);
        if (!condicion) {
            throw new CondicionMedicaNoEncontradaError(dto.condicionId);
        }

        // Verificar si ya existe la asignación
        const existe = await this.condicionMedicaRepository.existeCondicionPaciente(
            dto.pacienteId,
            dto.condicionId
        );

        if (existe) {
            throw new Error('Esta condición ya está asignada al paciente.');
        }

        return await this.condicionMedicaRepository.asignarAPaciente(dto);
    }

    async obtenerCondicionesPaciente(
        pacienteId: number,
        filtros: FiltroCondicionesPacienteDto
    ) {
        if (filtros.tipo) {
            filtros.tipo = this.normalizarTipo(filtros.tipo);
        }
        if (filtros.estado) {
            filtros.estado = this.normalizarEstado(filtros.estado);
        }
        return await this.condicionMedicaRepository.obtenerCondicionesPaciente(
            pacienteId,
            filtros
        );
    }

    async actualizarCondicionPaciente(
        pacienteId: number,
        condicionId: number,
        dto: ActualizarCondicionPacienteDto
    ) {
        const existe = await this.condicionMedicaRepository.existeCondicionPaciente(
            pacienteId,
            condicionId
        );

        if (!existe) {
            throw new Error('La condición no está asignada a este paciente.');
        }

        if (dto.estado) {
            dto.estado = this.normalizarEstado(dto.estado);
            await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo']);
        }

        return await this.condicionMedicaRepository.actualizarCondicionPaciente(
            pacienteId,
            condicionId,
            dto
        );
    }

    async removerCondicionPaciente(pacienteId: number, condicionId: number) {
        const existe = await this.condicionMedicaRepository.existeCondicionPaciente(
            pacienteId,
            condicionId
        );

        if (!existe) {
            throw new Error('La condición no está asignada a este paciente.');
        }

        return await this.condicionMedicaRepository.removerCondicionPaciente(
            pacienteId,
            condicionId
        );
    }

    // Métodos auxiliares
    private normalizarEstado(estado: string): string {
        if (!estado) return estado;
        return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
    }

    private normalizarTipo(tipo: string): string {
        if (!tipo) return tipo;
        return tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
    }

    private async validarTipo(tipo: string): Promise<void> {
        const tiposValidos = ['Alergia', 'Enfermedad', 'Condición'];
        if (!tiposValidos.includes(tipo)) {
            throw new Error(
                `Tipo de condición inválido. Debe ser uno de: ${tiposValidos.join(', ')}`
            );
        }
    }

    // Métodos para Pacientes
    async obtenerAlergias(filtros: any = {}) {
        return await this.condicionMedicaRepository.obtenerAlergias(filtros);
    }

    async buscarAlergias(dto: BuscarAlergiasDto) {
        if (!dto.query || dto.query.trim().length === 0) {
            throw new Error('El término de búsqueda es requerido.');
        }
        return await this.condicionMedicaRepository.buscarAlergias(dto);
    }

    async agregarMiAlergia(pacienteId: number, dto: AgregarAlergiaPersonalDto) {
        const condicion = await this.condicionMedicaRepository.obtenerPorId(dto.condicionId);
        if (!condicion) {
            throw new CondicionMedicaNoEncontradaError(dto.condicionId);
        }

        if (condicion.tipo !== 'Alergia') {
            throw new Error('La condición seleccionada no es una alergia.');
        }

        const existe = await this.condicionMedicaRepository.existeCondicionPaciente(
            pacienteId,
            dto.condicionId
        );

        if (existe) {
            throw new Error('Esta alergia ya está registrada en tu perfil.');
        }

        return await this.condicionMedicaRepository.agregarMiAlergia(pacienteId, dto);
    }

    async crearMiCondicion(pacienteId: number, dto: CrearCondicionPersonalDto) {
        if (!dto.notas || dto.notas.trim().length === 0) {
            throw new Error('Las notas son requeridas.');
        }

        return await this.condicionMedicaRepository.crearMiCondicion(pacienteId, dto);
    }

    async obtenerMisCondiciones(pacienteId: number, filtros: FiltroMisCondicionesDto) {
        if (filtros.tipo) {
            filtros.tipo = this.normalizarTipo(filtros.tipo);
        }
        if (filtros.estado) {
            filtros.estado = this.normalizarEstado(filtros.estado);
        }
        return await this.condicionMedicaRepository.obtenerMisCondiciones(pacienteId, filtros);
    }

    async actualizarMiAlergia(
        pacienteId: number,
        condicionId: number,
        dto: ActualizarMiCondicionDto
    ) {
        const existe = await this.condicionMedicaRepository.existeCondicionPaciente(
            pacienteId,
            condicionId
        );

        if (!existe) {
            throw new Error('Esta alergia no existe en tu perfil.');
        }

        if (dto.estado) {
            dto.estado = this.normalizarEstado(dto.estado);
            await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo']);
        }

        return await this.condicionMedicaRepository.actualizarMiAlergia(
            pacienteId,
            condicionId,
            dto
        );
    }

    async eliminarMiAlergia(pacienteId: number, condicionId: number) {
        const existe = await this.condicionMedicaRepository.existeCondicionPaciente(
            pacienteId,
            condicionId
        );

        if (!existe) {
            throw new Error('Esta alergia no existe en tu perfil.');
        }

        return await this.condicionMedicaRepository.eliminarMiAlergia(pacienteId, condicionId);
    }

    async actualizarMiCondicion(
        pacienteId: number,
        condicionId: number,
        dto: ActualizarMiCondicionDto
    ) {
        const existe = await this.condicionMedicaRepository.existeCondicionPaciente(
            pacienteId,
            condicionId
        );

        if (!existe) {
            throw new Error('Esta condición no existe en tu perfil.');
        }

        if (dto.estado) {
            dto.estado = this.normalizarEstado(dto.estado);
            await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo']);
        }

        return await this.condicionMedicaRepository.actualizarMiCondicion(
            pacienteId,
            condicionId,
            dto
        );
    }

    async eliminarMiCondicion(pacienteId: number, condicionId: number) {
        const existe = await this.condicionMedicaRepository.existeCondicionPaciente(
            pacienteId,
            condicionId
        );

        if (!existe) {
            throw new Error('Esta condición no existe en tu perfil.');
        }

        return await this.condicionMedicaRepository.eliminarMiCondicion(pacienteId, condicionId);
    }
}
