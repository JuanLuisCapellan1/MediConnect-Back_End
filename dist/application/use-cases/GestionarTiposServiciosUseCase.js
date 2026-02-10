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
exports.GestionarTiposServiciosUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const TipoServicioValidator_1 = require("../../domain/validators/TiposServicios/TipoServicioValidator");
const TipoServicioNoEncontradoError_1 = require("../../domain/errors/TiposServicios/TipoServicioNoEncontradoError");
const EstadoValidator_1 = require("../../domain/validators/Estados/EstadoValidator");
let GestionarTiposServiciosUseCase = class GestionarTiposServiciosUseCase {
    constructor(tipoServicioRepository, validator, estadoValidator) {
        this.tipoServicioRepository = tipoServicioRepository;
        this.validator = validator;
        this.estadoValidator = estadoValidator;
    }
    async crear(dto) {
        if (dto.estado) {
            dto.estado = this.normalizarEstado(dto.estado);
            await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo']);
        }
        await this.validator.validarCreacion(dto.nombre);
        return await this.tipoServicioRepository.crear(dto);
    }
    async obtenerPorId(id) {
        const encontrado = await this.tipoServicioRepository.obtenerPorId(id);
        if (!encontrado) {
            throw new TipoServicioNoEncontradoError_1.TipoServicioNoEncontradoError(id);
        }
        return encontrado;
    }
    async listar(filtros) {
        if (filtros.estado) {
            filtros.estado = this.normalizarEstado(filtros.estado);
        }
        return await this.tipoServicioRepository.obtenerTodas(filtros);
    }
    async actualizar(id, dto) {
        const existente = await this.tipoServicioRepository.obtenerPorId(id);
        if (!existente) {
            throw new TipoServicioNoEncontradoError_1.TipoServicioNoEncontradoError(id);
        }
        if (dto.nombre) {
            await this.validator.validarActualizacion(id, dto.nombre);
        }
        if (dto.estado) {
            dto.estado = this.normalizarEstado(dto.estado);
            await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo', 'Eliminado']);
        }
        return await this.tipoServicioRepository.actualizar(id, dto);
    }
    async eliminar(id) {
        const existente = await this.tipoServicioRepository.obtenerPorId(id);
        if (!existente) {
            throw new TipoServicioNoEncontradoError_1.TipoServicioNoEncontradoError(id);
        }
        return await this.tipoServicioRepository.eliminar(id);
    }
    normalizarEstado(estado) {
        if (!estado)
            return estado;
        return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
    }
};
exports.GestionarTiposServiciosUseCase = GestionarTiposServiciosUseCase;
exports.GestionarTiposServiciosUseCase = GestionarTiposServiciosUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('TipoServicioRepository')),
    __param(1, (0, tsyringe_1.inject)(TipoServicioValidator_1.TipoServicioValidator)),
    __param(2, (0, tsyringe_1.inject)(EstadoValidator_1.EstadoValidator)),
    __metadata("design:paramtypes", [Object, TipoServicioValidator_1.TipoServicioValidator,
        EstadoValidator_1.EstadoValidator])
], GestionarTiposServiciosUseCase);
