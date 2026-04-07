"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormacionAcademicaValidator = void 0;
const tsyringe_1 = require("tsyringe");
const FechasFormacionInvalidasError_1 = require("../../errors/FormacionesAcademicas/FechasFormacionInvalidasError");
let FormacionAcademicaValidator = class FormacionAcademicaValidator {
    /**
     * Valida que todos los campos requeridos estén presentes
     */
    validarCamposRequeridos(doctorId, universidadId, fechaInicio) {
        if (!doctorId || doctorId <= 0) {
            throw new Error('El ID del doctor es requerido y debe ser válido');
        }
        if (!universidadId || universidadId <= 0) {
            throw new Error('El ID de la universidad es requerido y debe ser válido');
        }
        if (!fechaInicio || !(fechaInicio instanceof Date) || isNaN(fechaInicio.getTime())) {
            throw new Error('La fecha de inicio es requerida y debe ser válida');
        }
    }
    /**
     * Valida que las fechas sean coherentes
     */
    validarFechas(fechaInicio, fechaFinalizacion) {
        // Validar que la fecha de inicio no sea futura
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        if (fechaInicio > hoy) {
            throw new FechasFormacionInvalidasError_1.FechasFormacionInvalidasError('La fecha de inicio no puede ser futura');
        }
        // Si hay fecha de finalización, validar que sea posterior a la de inicio
        if (fechaFinalizacion) {
            if (!(fechaFinalizacion instanceof Date) || isNaN(fechaFinalizacion.getTime())) {
                throw new FechasFormacionInvalidasError_1.FechasFormacionInvalidasError('La fecha de finalización debe ser válida');
            }
            if (fechaFinalizacion <= fechaInicio) {
                throw new FechasFormacionInvalidasError_1.FechasFormacionInvalidasError('La fecha de finalización debe ser posterior a la fecha de inicio');
            }
            // Validar que la fecha de finalización no sea muy futura (máximo 1 año en el futuro)
            const maxFechaFutura = new Date();
            maxFechaFutura.setFullYear(maxFechaFutura.getFullYear() + 1);
            if (fechaFinalizacion > maxFechaFutura) {
                throw new FechasFormacionInvalidasError_1.FechasFormacionInvalidasError('La fecha de finalización no puede ser más de un año en el futuro');
            }
        }
    }
    /**
     * Valida que el estado sea válido
     */
    validarEstadoValido(estado) {
        const estadosValidos = ['Activo', 'Inactivo', 'Eliminado'];
        if (!estadosValidos.includes(estado)) {
            throw new Error(`Estado inválido. Los estados válidos son: ${estadosValidos.join(', ')}`);
        }
    }
};
exports.FormacionAcademicaValidator = FormacionAcademicaValidator;
exports.FormacionAcademicaValidator = FormacionAcademicaValidator = __decorate([
    (0, tsyringe_1.injectable)()
], FormacionAcademicaValidator);
