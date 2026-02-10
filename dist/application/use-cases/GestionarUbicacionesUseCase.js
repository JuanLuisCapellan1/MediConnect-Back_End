"use strict";
/**
 * GestionarUbicacionesUseCase.ts
 * Casos de uso para la gestión de Ubicaciones
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
let GestionarUbicacionesUseCase = class GestionarUbicacionesUseCase {
    constructor(validator, repository) {
        this.validator = validator;
        this.repository = repository;
    }
    /**
     * Crea una nueva Ubicacion
     */
    async crear(dto) {
        await this.validator.validarCreacion(dto.barrioId, dto.direccion, dto.subBarrioId);
        if (dto.codigoPostal) {
            this.validator.validarCodigoPostal(dto.codigoPostal);
        }
        if (dto.puntoGeografico) {
            this.validator.validarPuntoGeografico(dto.puntoGeografico);
        }
        return await this.repository.crear(dto.barrioId, dto.direccion, dto.subBarrioId, dto.codigoPostal, dto.puntoGeografico);
    }
    /**
     * Lista todas las Ubicaciones
     */
    async listarTodas() {
        return await this.repository.listarTodas();
    }
    /**
     * Lista Ubicaciones por barrio
     */
    async listarPorBarrio(barrioId) {
        return await this.repository.listarPorBarrio(barrioId);
    }
    /**
     * Lista Ubicaciones por SubBarrio
     */
    async listarPorSubBarrio(subBarrioId) {
        return await this.repository.listarPorSubBarrio(subBarrioId);
    }
    /**
     * Busca una Ubicacion por ID
     */
    async buscarPorId(id) {
        return await this.repository.buscarPorId(id);
    }
    /**
     * Busca Ubicaciones por dirección
     */
    async buscarPorDireccion(direccion) {
        return await this.repository.buscarPorDireccion(direccion);
    }
    /**
     * Busca Ubicaciones por código postal
     */
    async buscarPorCodigoPostal(codigoPostal) {
        return await this.repository.buscarPorCodigoPostal(codigoPostal);
    }
    /**
     * Busca Ubicaciones por estado
     */
    async buscarPorEstado(estado) {
        return await this.repository.buscarPorEstado(estado);
    }
    /**
     * Actualiza una Ubicacion
     */
    async actualizar(dto) {
        // Validar que la ubicación exista
        const ubicacionExistente = await this.repository.buscarPorId(dto.id);
        if (!ubicacionExistente) {
            throw new Error(`Ubicacion con ID ${dto.id} no existe`);
        }
        // Validar cambios de barrio si es necesario
        if (dto.barrioId !== undefined || dto.subBarrioId !== undefined) {
            const barrioId = dto.barrioId !== undefined ? dto.barrioId : ubicacionExistente.barrioId;
            const subBarrioId = dto.subBarrioId !== undefined ? dto.subBarrioId : (ubicacionExistente.subBarrioId || undefined);
            await this.validator.validarActualizacionUbicacion(barrioId, subBarrioId, dto.id);
        }
        // Validar código postal si es proporcionado
        if (dto.codigoPostal !== undefined) {
            this.validator.validarCodigoPostal(dto.codigoPostal);
        }
        // Validar punto geográfico si es proporcionado
        if (dto.puntoGeografico !== undefined) {
            this.validator.validarPuntoGeografico(dto.puntoGeografico);
        }
        return await this.repository.actualizar(dto.id, dto.barrioId, dto.subBarrioId, dto.direccion, dto.codigoPostal, dto.estado, dto.puntoGeografico);
    }
    /**
     * Elimina una Ubicacion
     */
    async eliminar(id) {
        return await this.repository.eliminar(id);
    }
};
exports.GestionarUbicacionesUseCase = GestionarUbicacionesUseCase;
exports.GestionarUbicacionesUseCase = GestionarUbicacionesUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('UbicacionValidator')),
    __param(1, (0, tsyringe_1.inject)('IUbicacionesRepository')),
    __metadata("design:paramtypes", [UbicacionValidator_1.UbicacionValidator, Object])
], GestionarUbicacionesUseCase);
