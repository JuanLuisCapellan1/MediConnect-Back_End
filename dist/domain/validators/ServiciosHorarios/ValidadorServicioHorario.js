"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidadorServicioHorario = void 0;
/**
 * Validadores para ServicioHorario
 */
const ServicioHorarioInvalidoError_1 = require("../../errors/ServiciosHorarios/ServicioHorarioInvalidoError");
class ValidadorServicioHorario {
    /**
     * Valida que los IDs sean válidos
     */
    static validarIds(servicioId, horarioId) {
        if (!Number.isInteger(servicioId) || servicioId <= 0) {
            throw new ServicioHorarioInvalidoError_1.ServicioHorarioInvalidoError('El servicioId debe ser un número entero mayor a 0');
        }
        if (!Number.isInteger(horarioId) || horarioId <= 0) {
            throw new ServicioHorarioInvalidoError_1.ServicioHorarioInvalidoError('El horarioId debe ser un número entero mayor a 0');
        }
    }
    /**
     * Valida el estado
     */
    static validarEstado(estado) {
        const estadosValidos = ['Activo', 'Inactivo'];
        if (!estadosValidos.includes(estado)) {
            throw new ServicioHorarioInvalidoError_1.ServicioHorarioInvalidoError(`El estado debe ser uno de: ${estadosValidos.join(', ')}`);
        }
    }
    /**
     * Valida los datos completos de creación
     */
    static validarCreacion(servicioId, horarioId) {
        this.validarIds(servicioId, horarioId);
    }
    /**
     * Valida los datos de actualización
     */
    static validarActualizacion(servicioId, horarioId, estado) {
        if (servicioId !== undefined) {
            if (!Number.isInteger(servicioId) || servicioId <= 0) {
                throw new ServicioHorarioInvalidoError_1.ServicioHorarioInvalidoError('El nuevo servicioId debe ser un número entero mayor a 0');
            }
        }
        if (horarioId !== undefined) {
            if (!Number.isInteger(horarioId) || horarioId <= 0) {
                throw new ServicioHorarioInvalidoError_1.ServicioHorarioInvalidoError('El nuevo horarioId debe ser un número entero mayor a 0');
            }
        }
        if (estado) {
            this.validarEstado(estado);
        }
    }
}
exports.ValidadorServicioHorario = ValidadorServicioHorario;
