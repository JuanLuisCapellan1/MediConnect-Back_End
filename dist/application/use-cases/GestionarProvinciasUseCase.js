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
exports.GestionarProvinciasUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const ProvinciaValidator_1 = require("../../domain/validators/Provincias/ProvinciaValidator");
const EstadoValidator_1 = require("../../domain/validators/Estados/EstadoValidator");
let GestionarProvinciasUseCase = class GestionarProvinciasUseCase {
    constructor(provinciaRepo, validator, estadoValidator) {
        this.provinciaRepo = provinciaRepo;
        this.validator = validator;
        this.estadoValidator = estadoValidator;
    }
    async listar() {
        return await this.provinciaRepo.listarTodas();
    }
    async crear(dto) {
        await this.validator.validarCreacion(dto.nombre);
        return await this.provinciaRepo.crear(dto.nombre);
    }
    async buscarPorId(id) {
        return await this.provinciaRepo.buscarPorId(id);
    }
    async buscarPorNombre(nombre, estado) {
        return await this.provinciaRepo.buscarPorNombre(nombre, estado);
    }
    async buscarPorEstado(estado) {
        return await this.provinciaRepo.buscarPorEstado(estado);
    }
    async actualizar(dto) {
        // Validar nombre solo si se proporciona
        if (dto.nombre) {
            await this.validator.validarCreacion(dto.nombre);
        }
        // Validar estado solo si se proporciona
        if (dto.estado) {
            await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo', 'Eliminado']);
        }
        return await this.provinciaRepo.actualizar(dto.id, dto.nombre, dto.estado);
    }
    async eliminar(id) {
        return await this.provinciaRepo.eliminar(id);
    }
};
exports.GestionarProvinciasUseCase = GestionarProvinciasUseCase;
exports.GestionarProvinciasUseCase = GestionarProvinciasUseCase = __decorate([
    __param(1, (0, tsyringe_1.inject)(ProvinciaValidator_1.ProvinciaValidator)),
    __param(2, (0, tsyringe_1.inject)(EstadoValidator_1.EstadoValidator)),
    __metadata("design:paramtypes", [Object, ProvinciaValidator_1.ProvinciaValidator, EstadoValidator_1.EstadoValidator])
], GestionarProvinciasUseCase);
