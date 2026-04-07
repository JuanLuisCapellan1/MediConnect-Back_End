"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicioHorarioYaExisteError = void 0;
/**
 * Error cuando la relación ServicioHorario ya existe
 */
class ServicioHorarioYaExisteError extends Error {
    constructor(servicioId, horarioId) {
        super(`La relación entre el servicio ${servicioId} y el horario ${horarioId} ya existe.`);
        this.name = 'ServicioHorarioYaExisteError';
    }
}
exports.ServicioHorarioYaExisteError = ServicioHorarioYaExisteError;
