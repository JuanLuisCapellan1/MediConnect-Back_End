"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicioHorarioInvalidoError = void 0;
/**
 * Error cuando los datos del ServicioHorario son inválidos
 */
class ServicioHorarioInvalidoError extends Error {
    constructor(mensaje) {
        super(`Datos de ServicioHorario inválidos: ${mensaje}`);
        this.name = 'ServicioHorarioInvalidoError';
    }
}
exports.ServicioHorarioInvalidoError = ServicioHorarioInvalidoError;
