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
exports.GestionarPacientesUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const PacienteValidator_1 = require("../../domain/validators/Pacientes/PacienteValidator");
const EstadoValidator_1 = require("../../domain/validators/Estados/EstadoValidator");
const PacienteNoEncontradoError_1 = require("../../domain/errors/Pacientes/PacienteNoEncontradoError");
let GestionarPacientesUseCase = class GestionarPacientesUseCase {
    constructor(pacienteRepository, validator, estadoValidator) {
        this.pacienteRepository = pacienteRepository;
        this.validator = validator;
        this.estadoValidator = estadoValidator;
    }
    async obtenerPorId(id) {
        const paciente = await this.pacienteRepository.obtenerPorId(id);
        if (!paciente) {
            throw new PacienteNoEncontradoError_1.PacienteNoEncontradoError(id);
        }
        return paciente;
    }
    async obtenerPorUsuarioId(usuarioId) {
        const paciente = await this.pacienteRepository.obtenerPorUsuarioId(usuarioId);
        if (!paciente) {
            throw new PacienteNoEncontradoError_1.PacienteNoEncontradoError(usuarioId);
        }
        return paciente;
    }
    async listar(filtros) {
        // Normalizar estado si existe
        if (filtros.estado) {
            filtros.estado = this.normalizarEstado(filtros.estado);
        }
        return await this.pacienteRepository.obtenerTodos(filtros);
    }
    async actualizar(usuarioId, dto) {
        // Verificar que el paciente existe
        await this.obtenerPorUsuarioId(usuarioId);
        // Normalizar estado si existe
        if (dto.estado) {
            dto.estado = this.normalizarEstado(dto.estado);
        }
        // Validar documento único si se está actualizando
        // Nota: numero_documento_identificacion NO debería ser editable, pero validamos por seguridad
        // await this.validator.validarActualizacion(usuarioId); // This line is removed as per instruction
        return await this.pacienteRepository.actualizar(usuarioId, dto);
    }
    async eliminar(usuarioId) {
        // Verificar que el paciente existe
        await this.obtenerPorUsuarioId(usuarioId);
        await this.pacienteRepository.eliminar(usuarioId);
    }
    normalizarEstado(estado) {
        if (!estado)
            return estado;
        return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
    }
};
exports.GestionarPacientesUseCase = GestionarPacientesUseCase;
exports.GestionarPacientesUseCase = GestionarPacientesUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('PacienteRepository')),
    __param(1, (0, tsyringe_1.inject)(PacienteValidator_1.PacienteValidator)),
    __param(2, (0, tsyringe_1.inject)(EstadoValidator_1.EstadoValidator)),
    __metadata("design:paramtypes", [Object, PacienteValidator_1.PacienteValidator,
        EstadoValidator_1.EstadoValidator])
], GestionarPacientesUseCase);
