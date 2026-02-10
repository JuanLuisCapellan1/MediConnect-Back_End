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
exports.ProfesionValidator = void 0;
const tsyringe_1 = require("tsyringe");
const ProfesionYaExisteError_1 = require("../../errors/Profesiones/ProfesionYaExisteError");
let ProfesionValidator = class ProfesionValidator {
    constructor(profesionesRepository) {
        this.profesionesRepository = profesionesRepository;
    }
    async validarNombreUnico(nombre, excluyendoId) {
        const existe = await this.profesionesRepository.existePorNombre(nombre, excluyendoId);
        if (existe) {
            throw new ProfesionYaExisteError_1.ProfesionYaExisteError(nombre);
        }
    }
    validarNombreRequerido(nombre) {
        if (!nombre || nombre.trim() === '') {
            throw new Error('El nombre de la profesión es requerido');
        }
    }
    validarEstadoValido(estado) {
        const estadosValidos = ['Activo', 'Inactivo', 'Eliminado'];
        if (!estadosValidos.includes(estado)) {
            throw new Error(`Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`);
        }
    }
};
exports.ProfesionValidator = ProfesionValidator;
exports.ProfesionValidator = ProfesionValidator = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IProfesionesRepository')),
    __metadata("design:paramtypes", [Object])
], ProfesionValidator);
