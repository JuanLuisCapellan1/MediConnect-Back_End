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
exports.GestionarEspecialidadesUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const EspecialidadValidator_1 = require("../../domain/validators/Especialidades/EspecialidadValidator");
const EspecialidadNoEncontradaError_1 = require("../../domain/errors/Especialidades/EspecialidadNoEncontradaError");
const EstadoValidator_1 = require("../../domain/validators/Estados/EstadoValidator");
let GestionarEspecialidadesUseCase = class GestionarEspecialidadesUseCase {
    constructor(especialidadRepository, validator, estadoValidator) {
        this.especialidadRepository = especialidadRepository;
        this.validator = validator;
        this.estadoValidator = estadoValidator;
    }
    async crear(dto) {
        if (dto.estado) {
            dto.estado = this.normalizarEstado(dto.estado);
            await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo']);
        }
        await this.validator.validarCreacion(dto.nombre);
        return await this.especialidadRepository.crear(dto);
    }
    async obtenerPorId(id) {
        const encontrado = await this.especialidadRepository.obtenerPorId(id);
        if (!encontrado) {
            throw new EspecialidadNoEncontradaError_1.EspecialidadNoEncontradaError(id);
        }
        return encontrado;
    }
    async listar(filtros) {
        if (filtros.estado) {
            filtros.estado = this.normalizarEstado(filtros.estado);
        }
        return await this.especialidadRepository.obtenerTodas(filtros);
    }
    async actualizar(id, dto) {
        const existente = await this.especialidadRepository.obtenerPorId(id);
        if (!existente) {
            throw new EspecialidadNoEncontradaError_1.EspecialidadNoEncontradaError(id);
        }
        if (dto.nombre) {
            await this.validator.validarActualizacion(id, dto.nombre);
        }
        if (dto.estado) {
            dto.estado = this.normalizarEstado(dto.estado);
            await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo', 'Eliminado']);
        }
        return await this.especialidadRepository.actualizar(id, dto);
    }
    async eliminar(id) {
        const existente = await this.especialidadRepository.obtenerPorId(id);
        if (!existente) {
            throw new EspecialidadNoEncontradaError_1.EspecialidadNoEncontradaError(id);
        }
        return await this.especialidadRepository.eliminar(id);
    }
    normalizarEstado(estado) {
        if (!estado)
            return estado;
        return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
    }
};
exports.GestionarEspecialidadesUseCase = GestionarEspecialidadesUseCase;
exports.GestionarEspecialidadesUseCase = GestionarEspecialidadesUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('EspecialidadRepository')),
    __param(1, (0, tsyringe_1.inject)(EspecialidadValidator_1.EspecialidadValidator)),
    __param(2, (0, tsyringe_1.inject)(EstadoValidator_1.EstadoValidator)),
    __metadata("design:paramtypes", [Object, EspecialidadValidator_1.EspecialidadValidator,
        EstadoValidator_1.EstadoValidator])
], GestionarEspecialidadesUseCase);
