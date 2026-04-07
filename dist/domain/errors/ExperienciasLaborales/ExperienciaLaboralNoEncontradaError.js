"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperienciaLaboralNoEncontradaError = void 0;
class ExperienciaLaboralNoEncontradaError extends Error {
    constructor(id) {
        super(`No se encontró la experiencia laboral con ID: ${id}`);
        this.name = 'ExperienciaLaboralNoEncontradaError';
    }
}
exports.ExperienciaLaboralNoEncontradaError = ExperienciaLaboralNoEncontradaError;
