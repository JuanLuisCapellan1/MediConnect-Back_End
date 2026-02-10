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
exports.GestionarDistritosMunicipalesUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const DistritoMunicipalValidator_1 = require("../../domain/validators/DistritosMunicipales/DistritoMunicipalValidator");
const EstadoValidator_1 = require("../../domain/validators/Estados/EstadoValidator");
let GestionarDistritosMunicipalesUseCase = class GestionarDistritosMunicipalesUseCase {
    constructor(distritosRepo, validator, estadoValidator) {
        this.distritosRepo = distritosRepo;
        this.validator = validator;
        this.estadoValidator = estadoValidator;
    }
    async listar() {
        return await this.distritosRepo.listarTodas();
    }
    async crear(dto) {
        await this.validator.validarCreacion(dto.nombre, dto.municipioId);
        return await this.distritosRepo.crear(dto.municipioId, dto.nombre);
    }
    async buscarPorId(id) {
        return await this.distritosRepo.buscarPorId(id);
    }
    async listarPorMunicipio(municipioId) {
        return await this.distritosRepo.listarPorMunicipio(municipioId);
    }
    async buscarPorNombre(nombre, municipioId, estado) {
        return await this.distritosRepo.buscarPorNombre(nombre, municipioId, estado);
    }
    async buscarPorEstado(estado) {
        return await this.distritosRepo.buscarPorEstado(estado);
    }
    async actualizar(dto) {
        // Validar nombre solo si se proporciona
        if (dto.nombre && dto.municipioId) {
            await this.validator.validarCreacion(dto.nombre, dto.municipioId);
        }
        // Validar cambio de sección solo si se proporciona
        if (dto.municipioId) {
            await this.validator.validarActualizacionMunicipio(dto.municipioId, dto.id);
        }
        // Validar estado solo si se proporciona
        if (dto.estado) {
            await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo', 'Eliminado']);
        }
        return await this.distritosRepo.actualizar(dto.id, dto.municipioId, dto.nombre, dto.estado);
    }
    async eliminar(id) {
        return await this.distritosRepo.eliminar(id);
    }
};
exports.GestionarDistritosMunicipalesUseCase = GestionarDistritosMunicipalesUseCase;
exports.GestionarDistritosMunicipalesUseCase = GestionarDistritosMunicipalesUseCase = __decorate([
    __param(1, (0, tsyringe_1.inject)(DistritoMunicipalValidator_1.DistritoMunicipalValidator)),
    __param(2, (0, tsyringe_1.inject)(EstadoValidator_1.EstadoValidator)),
    __metadata("design:paramtypes", [Object, DistritoMunicipalValidator_1.DistritoMunicipalValidator,
        EstadoValidator_1.EstadoValidator])
], GestionarDistritosMunicipalesUseCase);
