"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicioHorarioNoEncontradoError = void 0;
/**
 * Error cuando no se encuentra la relación ServicioHorario
 */
class ServicioHorarioNoEncontradoError extends Error {
    constructor(servicioId, horarioId) {
        super(`No se encontró la relación entre el servicio ${servicioId} y el horario ${horarioId}.`);
        this.name = 'ServicioHorarioNoEncontradoError';
    }
}
exports.ServicioHorarioNoEncontradoError = ServicioHorarioNoEncontradoError;
