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
exports.GestionarTiposCentrosSaludUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const TipoCentroSaludValidator_1 = require("../../domain/validators/TiposCentrosSalud/TipoCentroSaludValidator");
const TipoCentroSaludNoEncontradoError_1 = require("../../domain/errors/TiposCentrosSalud/TipoCentroSaludNoEncontradoError");
const EstadoValidator_1 = require("../../domain/validators/Estados/EstadoValidator");
const TranslationHydrator_1 = require("../../infrastructure/services/TranslationHydrator");
let GestionarTiposCentrosSaludUseCase = class GestionarTiposCentrosSaludUseCase {
    constructor(tipoCentroSaludRepository, validator, estadoValidator, hydrator) {
        this.tipoCentroSaludRepository = tipoCentroSaludRepository;
        this.validator = validator;
        this.estadoValidator = estadoValidator;
        this.hydrator = hydrator;
    }
    async crear(dto) {
        if (dto.estado) {
            dto.estado = this.normalizarEstado(dto.estado);
            await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo']);
        }
        await this.validator.validarCreacion(dto.nombre);
        const resultado = await this.tipoCentroSaludRepository.crear(dto);
        this.hydrator.hydrateStrings([dto.nombre]).catch(() => { });
        return resultado;
    }
    async obtenerPorId(id) {
        const encontrado = await this.tipoCentroSaludRepository.obtenerPorId(id);
        if (!encontrado) {
            throw new TipoCentroSaludNoEncontradoError_1.TipoCentroSaludNoEncontradoError(id);
        }
        return encontrado;
    }
    async listar(filtros) {
        if (filtros.estado) {
            filtros.estado = this.normalizarEstado(filtros.estado);
        }
        return await this.tipoCentroSaludRepository.obtenerTodos(filtros);
    }
    async actualizar(id, dto) {
        const existente = await this.tipoCentroSaludRepository.obtenerPorId(id);
        if (!existente) {
            throw new TipoCentroSaludNoEncontradoError_1.TipoCentroSaludNoEncontradoError(id);
        }
        if (dto.nombre) {
            await this.validator.validarActualizacion(id, dto.nombre);
        }
        if (dto.estado) {
            dto.estado = this.normalizarEstado(dto.estado);
            await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo', 'Eliminado']);
        }
        const resultado = await this.tipoCentroSaludRepository.actualizar(id, dto);
        if (dto.nombre)
            this.hydrator.hydrateStrings([dto.nombre]).catch(() => { });
        return resultado;
    }
    async eliminar(id) {
        const existente = await this.tipoCentroSaludRepository.obtenerPorId(id);
        if (!existente) {
            throw new TipoCentroSaludNoEncontradoError_1.TipoCentroSaludNoEncontradoError(id);
        }
        return await this.tipoCentroSaludRepository.eliminar(id);
    }
    normalizarEstado(estado) {
        if (!estado)
            return estado;
        return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
    }
};
exports.GestionarTiposCentrosSaludUseCase = GestionarTiposCentrosSaludUseCase;
exports.GestionarTiposCentrosSaludUseCase = GestionarTiposCentrosSaludUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('TipoCentroSaludRepository')),
    __param(1, (0, tsyringe_1.inject)(TipoCentroSaludValidator_1.TipoCentroSaludValidator)),
    __param(2, (0, tsyringe_1.inject)(EstadoValidator_1.EstadoValidator)),
    __param(3, (0, tsyringe_1.inject)(TranslationHydrator_1.TranslationHydrator)),
    __metadata("design:paramtypes", [Object, TipoCentroSaludValidator_1.TipoCentroSaludValidator,
        EstadoValidator_1.EstadoValidator,
        TranslationHydrator_1.TranslationHydrator])
], GestionarTiposCentrosSaludUseCase);
