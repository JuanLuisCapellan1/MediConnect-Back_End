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
exports.EspecialidadValidator = void 0;
const tsyringe_1 = require("tsyringe");
const EspecialidadYaExisteError_1 = require("../../errors/Especialidades/EspecialidadYaExisteError");
let EspecialidadValidator = class EspecialidadValidator {
    constructor(especialidadRepository) {
        this.especialidadRepository = especialidadRepository;
    }
    async validarCreacion(nombre) {
        const existe = await this.especialidadRepository.existeNombre(nombre);
        if (existe) {
            throw new EspecialidadYaExisteError_1.EspecialidadYaExisteError(nombre);
        }
    }
    async validarActualizacion(id, nombre) {
        const existe = await this.especialidadRepository.existeNombre(nombre, id);
        if (existe) {
            throw new EspecialidadYaExisteError_1.EspecialidadYaExisteError(nombre);
        }
    }
};
exports.EspecialidadValidator = EspecialidadValidator;
exports.EspecialidadValidator = EspecialidadValidator = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('EspecialidadRepository')),
    __metadata("design:paramtypes", [Object])
], EspecialidadValidator);
