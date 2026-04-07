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
exports.GestionarBarriosUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const BarrioValidator_1 = require("../../domain/validators/Barrios/BarrioValidator");
const EstadoValidator_1 = require("../../domain/validators/Estados/EstadoValidator");
let GestionarBarriosUseCase = class GestionarBarriosUseCase {
    constructor(barrioRepo, validator, estadoValidator) {
        this.barrioRepo = barrioRepo;
        this.validator = validator;
        this.estadoValidator = estadoValidator;
    }
    /**
     * Lista todos los barrios activos
     */
    async listar() {
        return await this.barrioRepo.listarTodas();
    }
    /**
     * Crea un nuevo barrio
     * @param dto - Contiene seccionId y nombre
     */
    async crear(dto) {
        await this.validator.validarCreacion(dto.nombre, dto.seccionId);
        return await this.barrioRepo.crear(dto.seccionId, dto.nombre);
    }
    /**
     * Busca un barrio por su ID
     * @param id - ID del barrio
     */
    async buscarPorId(id) {
        return await this.barrioRepo.buscarPorId(id);
    }
    /**
     * Lista todos los barrios de una sección específica
     * @param seccionId - ID de la sección
     */
    async listarPorSeccion(seccionId) {
        return await this.barrioRepo.listarPorSeccion(seccionId);
    }
    /**
     * Busca barrios por nombre en una sección específica
     * @param nombre - Nombre del barrio (búsqueda parcial)
     * @param seccionId - ID de la sección
     * @param estado - Estado del barrio (Activo, Inactivo, Eliminado)
     */
    async buscarPorNombre(nombre, seccionId, estado) {
        return await this.barrioRepo.buscarPorNombre(nombre, seccionId, estado);
    }
    /**
     * Busca barrios por estado
     * @param estado - Estado del barrio (Activo, Inactivo, Eliminado)
     */
    async buscarPorEstado(estado) {
        return await this.barrioRepo.buscarPorEstado(estado);
    }
    /**
     * Actualiza un barrio existente
     * @param dto - Contiene id y los campos a actualizar
     */
    async actualizar(dto) {
        // Validar nombre solo si se proporciona
        if (dto.nombre && dto.seccionId) {
            await this.validator.validarCreacion(dto.nombre, dto.seccionId);
        }
        // Validar cambio de sección solo si se proporciona
        if (dto.seccionId) {
            await this.validator.validarActualizacionSeccion(dto.seccionId, dto.id);
        }
        // Validar estado solo si se proporciona
        if (dto.estado) {
            await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo', 'Eliminado']);
        }
        return await this.barrioRepo.actualizar(dto.id, dto.seccionId, dto.nombre, dto.estado);
    }
    /**
     * Elimina un barrio (eliminación lógica)
     * @param id - ID del barrio a eliminar
     */
    async eliminar(id) {
        return await this.barrioRepo.eliminar(id);
    }
    /**
     * Busca el barrio cuyo polígono contiene el punto (longitud, latitud).
     * @param longitud - Longitud (X) del punto
     * @param latitud  - Latitud (Y) del punto
     */
    async buscarPorCoordenadas(longitud, latitud) {
        return await this.barrioRepo.buscarPorCoordenadas(longitud, latitud);
    }
    /**
     * Obtiene un barrio con su geometría completa (GeoJSON).
     * @param id - ID del barrio
     */
    async obtenerGeometria(id) {
        return await this.barrioRepo.obtenerGeometria(id);
    }
};
exports.GestionarBarriosUseCase = GestionarBarriosUseCase;
exports.GestionarBarriosUseCase = GestionarBarriosUseCase = __decorate([
    __param(1, (0, tsyringe_1.inject)(BarrioValidator_1.BarrioValidator)),
    __param(2, (0, tsyringe_1.inject)(EstadoValidator_1.EstadoValidator)),
    __metadata("design:paramtypes", [Object, BarrioValidator_1.BarrioValidator,
        EstadoValidator_1.EstadoValidator])
], GestionarBarriosUseCase);
