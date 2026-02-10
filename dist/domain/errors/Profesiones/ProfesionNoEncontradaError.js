"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfesionNoEncontradaError = void 0;
class ProfesionNoEncontradaError extends Error {
    constructor(id) {
        super(`No se encontró la profesión con ID: ${id}`);
        this.name = 'ProfesionNoEncontradaError';
    }
}
exports.ProfesionNoEncontradaError = ProfesionNoEncontradaError;
