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
exports.GestionarMunicipiosUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const MunicipioValidator_1 = require("../../domain/validators/Municipios/MunicipioValidator");
const EstadoValidator_1 = require("../../domain/validators/Estados/EstadoValidator");
let GestionarMunicipiosUseCase = class GestionarMunicipiosUseCase {
    constructor(municipioRepo, validator, estadoValidator) {
        this.municipioRepo = municipioRepo;
        this.validator = validator;
        this.estadoValidator = estadoValidator;
    }
    async listar() {
        return await this.municipioRepo.listarTodas();
    }
    async crear(dto) {
        await this.validator.validarCreacion(dto.nombre, dto.provinciaId);
        return await this.municipioRepo.crear(dto.provinciaId, dto.nombre);
    }
    async buscarPorId(id) {
        return await this.municipioRepo.buscarPorId(id);
    }
    async listarPorProvincia(provinciaId) {
        return await this.municipioRepo.listarPorProvincia(provinciaId);
    }
    async buscarPorNombre(nombre, provinciaId, estado) {
        return await this.municipioRepo.buscarPorNombre(nombre, provinciaId, estado);
    }
    async buscarPorEstado(estado) {
        return await this.municipioRepo.buscarPorEstado(estado);
    }
    async actualizar(dto) {
        // Validar nombre solo si se proporciona
        if (dto.nombre && dto.provinciaId) {
            await this.validator.validarCreacion(dto.nombre, dto.provinciaId);
        }
        // Validar cambio de provincia solo si se proporciona
        if (dto.provinciaId) {
            await this.validator.validarActualizacionProvincia(dto.provinciaId, dto.id);
        }
        // Validar estado solo si se proporciona
        if (dto.estado) {
            await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo', 'Eliminado']);
        }
        return await this.municipioRepo.actualizar(dto.id, dto.provinciaId, dto.nombre, dto.estado);
    }
    async eliminar(id) {
        return await this.municipioRepo.eliminar(id);
    }
};
exports.GestionarMunicipiosUseCase = GestionarMunicipiosUseCase;
exports.GestionarMunicipiosUseCase = GestionarMunicipiosUseCase = __decorate([
    __param(1, (0, tsyringe_1.inject)(MunicipioValidator_1.MunicipioValidator)),
    __param(2, (0, tsyringe_1.inject)(EstadoValidator_1.EstadoValidator)),
    __metadata("design:paramtypes", [Object, MunicipioValidator_1.MunicipioValidator,
        EstadoValidator_1.EstadoValidator])
], GestionarMunicipiosUseCase);
