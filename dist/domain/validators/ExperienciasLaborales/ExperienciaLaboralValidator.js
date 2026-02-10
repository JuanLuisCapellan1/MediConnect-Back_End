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
const InstitucionRequeridaError_1 = require("../../errors/ExperienciasLaborales/InstitucionRequeridaError");
let ExperienciaLaboralValidator = class ExperienciaLaboralValidator {
    constructor(experienciasLaboralesRepository) {
        this.experienciasLaboralesRepository = experienciasLaboralesRepository;
    }
    validarCamposRequeridos(doctorId, profesionId, descripcionCargo, fechaInicio) {
        if (!doctorId || doctorId <= 0) {
            throw new Error('El ID del doctor es requerido y debe ser válido');
        }
        if (!profesionId || profesionId <= 0) {
            throw new Error('El ID de la profesión es requerido y debe ser válido');
        }
        if (!descripcionCargo || descripcionCargo.trim() === '') {
            throw new Error('La descripción del cargo es requerida');
        }
        if (!fechaInicio) {
            throw new Error('La fecha de inicio es requerida');
        }
    }
    validarInstitucion(centroSaludId, institucionExterna) {
        // Al menos uno debe estar presente
        if (!centroSaludId && (!institucionExterna || institucionExterna.trim() === '')) {
            throw new InstitucionRequeridaError_1.InstitucionRequeridaError();
        }
        // No pueden estar ambos presentes
        if (centroSaludId && institucionExterna && institucionExterna.trim() !== '') {
            throw new Error('Solo puede especificar un centro de salud o una institución externa, no ambos');
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
    validarDescripcionCargo(descripcion) {
        if (descripcion.length < 5) {
            throw new Error('La descripción del cargo debe tener al menos 5 caracteres');
        }
        if (descripcion.length > 200) {
            throw new Error('La descripción del cargo no puede exceder 200 caracteres');
        }
    }
    validarInstitucionExterna(institucion) {
        if (institucion.length > 150) {
            throw new Error('El nombre de la institución externa no puede exceder 150 caracteres');
        }
    }
};
exports.ExperienciaLaboralValidator = ExperienciaLaboralValidator;
exports.ExperienciaLaboralValidator = ExperienciaLaboralValidator = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IExperienciasLaboralesRepository')),
    __metadata("design:paramtypes", [Object])
], ExperienciaLaboralValidator);
