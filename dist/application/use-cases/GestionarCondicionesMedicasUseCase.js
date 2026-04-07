"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GestionarCondicionesMedicasUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const CondicionMedicaValidator_1 = require("../../domain/validators/CondicionesMedicas/CondicionMedicaValidator");
const CondicionMedicaNoEncontradaError_1 = require("../../domain/errors/CondicionesMedicas/CondicionMedicaNoEncontradaError");
const EstadoValidator_1 = require("../../domain/validators/Estados/EstadoValidator");
let GestionarCondicionesMedicasUseCase = class GestionarCondicionesMedicasUseCase {
    constructor(condicionMedicaRepository, validator, estadoValidator) {
        this.condicionMedicaRepository = condicionMedicaRepository;
        this.validator = validator;
        this.estadoValidator = estadoValidator;
    }
    async crear(dto) {
        // Normalizar tipo
        dto.tipo = this.normalizarTipo(dto.tipo);
        // Validar tipo
        await this.validarTipo(dto.tipo);
        // Validar nombre único
        await this.validator.validarCreacion(dto.nombre);
        return await this.condicionMedicaRepository.crear(dto);
    }
    async obtenerPorId(id) {
        const encontrado = await this.condicionMedicaRepository.obtenerPorId(id);
        if (!encontrado) {
            throw new CondicionMedicaNoEncontradaError_1.CondicionMedicaNoEncontradaError(id);
        }
        return encontrado;
    }
    async listar(filtros) {
        if (filtros.estado) {
            filtros.estado = this.normalizarEstado(filtros.estado);
        }
        if (filtros.tipo) {
            filtros.tipo = this.normalizarTipo(filtros.tipo);
        }
        return await this.condicionMedicaRepository.obtenerTodas(filtros);
    }
    async actualizar(id, dto) {
        const existente = await this.condicionMedicaRepository.obtenerPorId(id);
        if (!existente) {
            throw new CondicionMedicaNoEncontradaError_1.CondicionMedicaNoEncontradaError(id);
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
    async eliminar(id) {
        const existente = await this.condicionMedicaRepository.obtenerPorId(id);
        if (!existente) {
            throw new CondicionMedicaNoEncontradaError_1.CondicionMedicaNoEncontradaError(id);
        }
        return await this.condicionMedicaRepository.eliminar(id);
    }
    // Métodos para gestión de condiciones de pacientes
    async asignarAPaciente(dto) {
        // Verificar que la condición existe
        const condicion = await this.condicionMedicaRepository.obtenerPorId(dto.condicionId);
        if (!condicion) {
            throw new CondicionMedicaNoEncontradaError_1.CondicionMedicaNoEncontradaError(dto.condicionId);
        }
        // Verificar si ya existe la asignación
        const existe = await this.condicionMedicaRepository.existeCondicionPaciente(dto.pacienteId, dto.condicionId);
        if (existe) {
            throw new Error('Esta condición ya está asignada al paciente.');
        }
        return await this.condicionMedicaRepository.asignarAPaciente(dto);
    }
    async obtenerCondicionesPaciente(pacienteId, filtros) {
        if (filtros.tipo) {
            filtros.tipo = this.normalizarTipo(filtros.tipo);
        }
        if (filtros.estado) {
            filtros.estado = this.normalizarEstado(filtros.estado);
        }
        return await this.condicionMedicaRepository.obtenerCondicionesPaciente(pacienteId, filtros);
    }
    async actualizarCondicionPaciente(pacienteId, condicionId, dto) {
        const existe = await this.condicionMedicaRepository.existeCondicionPaciente(pacienteId, condicionId);
        if (!existe) {
            throw new Error('La condición no está asignada a este paciente.');
        }
        if (dto.estado) {
            dto.estado = this.normalizarEstado(dto.estado);
            await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo']);
        }
        return await this.condicionMedicaRepository.actualizarCondicionPaciente(pacienteId, condicionId, dto);
    }
    async removerCondicionPaciente(pacienteId, condicionId) {
        const existe = await this.condicionMedicaRepository.existeCondicionPaciente(pacienteId, condicionId);
        if (!existe) {
            throw new Error('La condición no está asignada a este paciente.');
        }
        return await this.condicionMedicaRepository.removerCondicionPaciente(pacienteId, condicionId);
    }
    // Métodos auxiliares
    normalizarEstado(estado) {
        if (!estado)
            return estado;
        return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
    }
    normalizarTipo(tipo) {
        if (!tipo)
            return tipo;
        return tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
    }
    async validarTipo(tipo) {
        const tiposValidos = ['Alergia', 'Enfermedad', 'Condición'];
        if (!tiposValidos.includes(tipo)) {
            throw new Error(`Tipo de condición inválido. Debe ser uno de: ${tiposValidos.join(', ')}`);
        }
    }
    // Métodos para Pacientes
    async obtenerAlergias(filtros = {}) {
        return await this.condicionMedicaRepository.obtenerAlergias(filtros);
    }
    async buscarAlergias(dto) {
        if (!dto.query || dto.query.trim().length === 0) {
            throw new Error('El término de búsqueda es requerido.');
        }
        return await this.condicionMedicaRepository.buscarAlergias(dto);
    }
    async agregarMiAlergia(pacienteId, dto) {
        const condicion = await this.condicionMedicaRepository.obtenerPorId(dto.condicionId);
        if (!condicion) {
            throw new CondicionMedicaNoEncontradaError_1.CondicionMedicaNoEncontradaError(dto.condicionId);
        }
        if (condicion.tipo !== 'Alergia') {
            throw new Error('La condición seleccionada no es una alergia.');
        }
        const existe = await this.condicionMedicaRepository.existeCondicionPaciente(pacienteId, dto.condicionId);
        if (existe) {
            throw new Error('Esta alergia ya está registrada en tu perfil.');
        }
        return await this.condicionMedicaRepository.agregarMiAlergia(pacienteId, dto);
    }
    async crearMiCondicion(pacienteId, dto) {
        if (!dto.notas || dto.notas.trim().length === 0) {
            throw new Error('Las notas son requeridas.');
        }
        return await this.condicionMedicaRepository.crearMiCondicion(pacienteId, dto);
    }
    async obtenerMisCondiciones(pacienteId, filtros) {
        if (filtros.tipo) {
            filtros.tipo = this.normalizarTipo(filtros.tipo);
        }
        if (filtros.estado) {
            filtros.estado = this.normalizarEstado(filtros.estado);
        }
        return await this.condicionMedicaRepository.obtenerMisCondiciones(pacienteId, filtros);
    }
    async actualizarMiAlergia(pacienteId, condicionId, dto) {
        const existe = await this.condicionMedicaRepository.existeCondicionPaciente(pacienteId, condicionId);
        if (!existe) {
            throw new Error('Esta alergia no existe en tu perfil.');
        }
        if (dto.estado) {
            dto.estado = this.normalizarEstado(dto.estado);
            await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo']);
        }
        return await this.condicionMedicaRepository.actualizarMiAlergia(pacienteId, condicionId, dto);
    }
    async eliminarMiAlergia(pacienteId, condicionId) {
        const existe = await this.condicionMedicaRepository.existeCondicionPaciente(pacienteId, condicionId);
        if (!existe) {
            throw new Error('Esta alergia no existe en tu perfil.');
        }
        return await this.condicionMedicaRepository.eliminarMiAlergia(pacienteId, condicionId);
    }
    async actualizarMiCondicion(pacienteId, condicionId, dto) {
        const existe = await this.condicionMedicaRepository.existeCondicionPaciente(pacienteId, condicionId);
        if (!existe) {
            throw new Error('Esta condición no existe en tu perfil.');
        }
        if (dto.estado) {
            dto.estado = this.normalizarEstado(dto.estado);
            await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo']);
        }
        return await this.condicionMedicaRepository.actualizarMiCondicion(pacienteId, condicionId, dto);
    }
    async eliminarMiCondicion(pacienteId, condicionId) {
        const existe = await this.condicionMedicaRepository.existeCondicionPaciente(pacienteId, condicionId);
        if (!existe) {
            throw new Error('Esta condición no existe en tu perfil.');
        }
        return await this.condicionMedicaRepository.eliminarMiCondicion(pacienteId, condicionId);
    }
};
exports.GestionarCondicionesMedicasUseCase = GestionarCondicionesMedicasUseCase;
exports.GestionarCondicionesMedicasUseCase = GestionarCondicionesMedicasUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('CondicionMedicaRepository')),
    __param(1, (0, tsyringe_1.inject)(CondicionMedicaValidator_1.CondicionMedicaValidator)),
    __param(2, (0, tsyringe_1.inject)(EstadoValidator_1.EstadoValidator)),
    __metadata("design:paramtypes", [Object, CondicionMedicaValidator_1.CondicionMedicaValidator,
        EstadoValidator_1.EstadoValidator])
], GestionarCondicionesMedicasUseCase);
