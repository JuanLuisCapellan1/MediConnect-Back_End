"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EspecialidadNoEncontradaError = void 0;
class EspecialidadNoEncontradaError extends Error {
    constructor(id) {
        super(`No se encontró la especialidad con ID: ${id}.`);
        this.name = 'EspecialidadNoEncontradaError';
    }
}
exports.EspecialidadNoEncontradaError = EspecialidadNoEncontradaError;
