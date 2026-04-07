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
exports.ExperienciaLaboralValidator = void 0;
const tsyringe_1 = require("tsyringe");
const FechasInvalidasError_1 = require("../../errors/ExperienciasLaborales/FechasInvalidasError");
let ExperienciaLaboralValidator = class ExperienciaLaboralValidator {
    constructor(experienciaLaboralRepository) {
        this.experienciaLaboralRepository = experienciaLaboralRepository;
    }
    validarCamposRequeridos(doctorId, institucion, posicion, fechaInicio) {
        if (!doctorId || doctorId <= 0) {
            throw new Error('El ID del doctor es requerido y debe ser válido');
        }
        if (!institucion || institucion.trim() === '') {
            throw new Error('La institución es requerida');
        }
        if (!posicion || posicion.trim() === '') {
            throw new Error('La posición es requerida');
        }
        if (!fechaInicio) {
            throw new Error('La fecha de inicio es requerida');
        }
    }
    validarInstitucion(institucion) {
        if (institucion.trim().length < 2) {
            throw new Error('El nombre de la institución debe tener al menos 2 caracteres');
        }
        if (institucion.length > 150) {
            throw new Error('El nombre de la institución no puede exceder 150 caracteres');
        }
    }
    validarPosicion(posicion) {
        if (posicion.trim().length < 2) {
            throw new Error('La posición debe tener al menos 2 caracteres');
        }
        if (posicion.length > 100) {
            throw new Error('La posición no puede exceder 100 caracteres');
        }
    }
    validarFechas(fechaInicio, fechaFinalizacion, trabajaActualmente) {
        const ahora = new Date();
        // Validar que la fecha de inicio no sea futura
        if (fechaInicio > ahora) {
            throw new FechasInvalidasError_1.FechasInvalidasError('La fecha de inicio no puede ser futura');
        }
        // Si trabaja actualmente, no debe haber fecha de finalización
        if (trabajaActualmente && fechaFinalizacion) {
            throw new FechasInvalidasError_1.FechasInvalidasError('Si el doctor trabaja actualmente en este puesto, no debe especificar fecha de finalización');
        }
        // Si no trabaja actualmente, debe haber fecha de finalización
        if (!trabajaActualmente && !fechaFinalizacion) {
            throw new FechasInvalidasError_1.FechasInvalidasError('Si el doctor no trabaja actualmente en este puesto, debe especificar fecha de finalización');
        }
        // Si hay fecha de finalización, validar que sea posterior a la fecha de inicio
        if (fechaFinalizacion) {
            if (fechaFinalizacion <= fechaInicio) {
                throw new FechasInvalidasError_1.FechasInvalidasError('La fecha de finalización debe ser posterior a la fecha de inicio');
            }
            // Validar que la fecha de finalización no sea futura
            if (fechaFinalizacion > ahora) {
                throw new FechasInvalidasError_1.FechasInvalidasError('La fecha de finalización no puede ser futura');
            }
        }
    }
    validarEstadoValido(estado) {
        const estadosValidos = ['Activo', 'Inactivo', 'Eliminado'];
        if (!estadosValidos.includes(estado)) {
            throw new Error(`Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`);
        }
    }
};
exports.ExperienciaLaboralValidator = ExperienciaLaboralValidator;
exports.ExperienciaLaboralValidator = ExperienciaLaboralValidator = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IExperienciaLaboralRepository')),
    __metadata("design:paramtypes", [Object])
], ExperienciaLaboralValidator);
