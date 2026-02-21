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
exports.GestionarSeccionesUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const SeccionValidator_1 = require("../../domain/validators/Secciones/SeccionValidator");
const Seccion_1 = require("../../domain/entities/Seccion");
const EstadoValidator_1 = require("../../domain/validators/Estados/EstadoValidator");
let GestionarSeccionesUseCase = class GestionarSeccionesUseCase {
    constructor(seccionesRepository, validator, estadoValidator) {
        this.seccionesRepository = seccionesRepository;
        this.validator = validator;
        this.estadoValidator = estadoValidator;
    }
    async obtenerTodas(estado) {
        return await this.seccionesRepository.obtenerTodas(estado);
    }
    async obtenerPorId(id) {
        const seccion = await this.seccionesRepository.obtenerPorId(id);
        if (!seccion) {
            throw new Error(`Sección con ID ${id} no encontrada`);
        }
        return seccion;
    }
    async obtenerPorDistrito(distritoMunicipalId, estado) {
        return await this.seccionesRepository.obtenerPorDistrito(distritoMunicipalId, estado);
    }
    async obtenerPorMunicipio(municipioId, estado) {
        return await this.seccionesRepository.obtenerPorMunicipio(municipioId, estado);
    }
    async buscarPorNombre(nombre, distritoMunicipalId, estado) {
        const seccion = await this.seccionesRepository.buscarPorNombre(nombre, distritoMunicipalId, estado);
        if (!seccion) {
            throw new Error(`No se encontró Sección con nombre "${nombre}" en el Distrito Municipal con ID ${distritoMunicipalId}`);
        }
        return seccion;
    }
    async crear(dto) {
        if (dto.distritoMunicipalId !== undefined) {
            await this.validator.validar(dto.nombre, dto.distritoMunicipalId);
        }
        else {
            await this.validator.validar(dto.nombre);
        }
        const seccionPorNombre = await this.seccionesRepository.buscarPorNombreSensitive(dto.nombre);
        if (seccionPorNombre.length > 0) {
            throw new Error(`Ya existe una sección con el nombre "${dto.nombre}"`);
        }
        const seccion = new Seccion_1.Seccion(0, dto.distritoMunicipalId ?? null, dto.nombre, 'Activo', new Date());
        return await this.seccionesRepository.crear(seccion);
    }
    async actualizar(id, dto) {
        if (dto.nombre !== undefined || dto.distritoMunicipalId !== undefined) {
            const seccionExistente = await this.obtenerPorId(id);
            const distritoFinal = dto.distritoMunicipalId !== undefined ? dto.distritoMunicipalId : seccionExistente.distritoMunicipalId;
            await this.validator.validar(dto.nombre || seccionExistente.nombre, distritoFinal);
        }
        if (dto.distritoMunicipalId !== undefined) {
            await this.validator.validarActualizacionDistrito(dto.distritoMunicipalId, id);
        }
        // Validar estado solo si se proporciona
        if (dto.estado) {
            await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo', 'Eliminado']);
        }
        return await this.seccionesRepository.actualizar(id, dto);
    }
    async eliminar(id) {
        await this.obtenerPorId(id); // Verifica que existe
        await this.seccionesRepository.eliminar(id);
    }
};
exports.GestionarSeccionesUseCase = GestionarSeccionesUseCase;
exports.GestionarSeccionesUseCase = GestionarSeccionesUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('SeccionesRepository')),
    __param(1, (0, tsyringe_1.inject)('SeccionValidator')),
    __param(2, (0, tsyringe_1.inject)('EstadoValidator')),
    __metadata("design:paramtypes", [Object, SeccionValidator_1.SeccionValidator,
        EstadoValidator_1.EstadoValidator])
], GestionarSeccionesUseCase);
