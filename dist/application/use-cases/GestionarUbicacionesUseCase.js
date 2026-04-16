"use strict";
/**
 * GestionarUbicacionesUseCase.ts — sin subBarrioId tras eliminar sub_barrios
 */
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
exports.GestionarUbicacionesUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const UbicacionValidator_1 = require("../../domain/validators/Ubicaciones/UbicacionValidator");
const TranslationHydrator_1 = require("../../infrastructure/services/TranslationHydrator");
let GestionarUbicacionesUseCase = class GestionarUbicacionesUseCase {
    constructor(validator, repository, hydrator) {
        this.validator = validator;
        this.repository = repository;
        this.hydrator = hydrator;
    }
    async crear(dto) {
        await this.validator.validarCreacion(dto.barrioId, dto.direccion);
        if (dto.codigoPostal) {
            this.validator.validarCodigoPostal(dto.codigoPostal);
        }
        if (dto.puntoGeografico) {
            this.validator.validarPuntoGeografico(dto.puntoGeografico);
        }
        const resultado = await this.repository.crear(dto.barrioId, dto.direccion, dto.codigoPostal, dto.puntoGeografico, dto.nombre);
        if (dto.nombre)
            this.hydrator?.hydrateStrings([dto.nombre]).catch(() => { });
        return resultado;
    }
    async listarTodas() {
        return await this.repository.listarTodas();
    }
    async listarPorBarrio(barrioId) {
        return await this.repository.listarPorBarrio(barrioId);
    }
    async buscarPorId(id) {
        return await this.repository.buscarPorId(id);
    }
    async buscarPorDireccion(direccion) {
        return await this.repository.buscarPorDireccion(direccion);
    }
    async buscarPorCodigoPostal(codigoPostal) {
        return await this.repository.buscarPorCodigoPostal(codigoPostal);
    }
    async buscarPorEstado(estado) {
        return await this.repository.buscarPorEstado(estado);
    }
    async actualizar(dto) {
        const ubicacionExistente = await this.repository.buscarPorId(dto.id);
        if (!ubicacionExistente) {
            throw new Error(`Ubicacion con ID ${dto.id} no existe`);
        }
        if (dto.barrioId !== undefined) {
            await this.validator.validarActualizacionUbicacion(dto.barrioId, undefined, dto.id);
        }
        if (dto.codigoPostal !== undefined) {
            this.validator.validarCodigoPostal(dto.codigoPostal);
        }
        if (dto.puntoGeografico !== undefined) {
            this.validator.validarPuntoGeografico(dto.puntoGeografico);
        }
        const resultado = await this.repository.actualizar(dto.id, dto.barrioId, dto.direccion, dto.codigoPostal, dto.estado, dto.puntoGeografico, dto.nombre);
        if (dto.nombre)
            this.hydrator?.hydrateStrings([dto.nombre]).catch(() => { });
        return resultado;
    }
    async eliminar(id) {
        return await this.repository.eliminar(id);
    }
    async listarPorDoctor(doctorId) {
        return await this.repository.listarPorDoctor(doctorId);
    }
    async crearParaDoctor(doctorId, dto) {
        await this.validator.validarCreacion(dto.barrioId, dto.direccion);
        if (dto.codigoPostal) {
            this.validator.validarCodigoPostal(dto.codigoPostal);
        }
        if (dto.puntoGeografico) {
            this.validator.validarPuntoGeografico(dto.puntoGeografico);
        }
        const resultado = await this.repository.crearParaDoctor(doctorId, dto.barrioId, dto.direccion, dto.codigoPostal, dto.puntoGeografico, dto.nombre);
        if (dto.nombre)
            this.hydrator?.hydrateStrings([dto.nombre]).catch(() => { });
        return resultado;
    }
};
exports.GestionarUbicacionesUseCase = GestionarUbicacionesUseCase;
exports.GestionarUbicacionesUseCase = GestionarUbicacionesUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('UbicacionValidator')),
    __param(1, (0, tsyringe_1.inject)('IUbicacionesRepository')),
    __param(2, (0, tsyringe_1.inject)(TranslationHydrator_1.TranslationHydrator)),
    __metadata("design:paramtypes", [UbicacionValidator_1.UbicacionValidator, Object, TranslationHydrator_1.TranslationHydrator])
], GestionarUbicacionesUseCase);
