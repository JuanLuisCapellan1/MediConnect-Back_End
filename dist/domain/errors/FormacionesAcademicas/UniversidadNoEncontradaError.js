"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversidadNoEncontradaError = void 0;
class UniversidadNoEncontradaError extends Error {
    constructor(id) {
        super(`No se encontró la universidad con ID: ${id}`);
        this.name = 'UniversidadNoEncontradaError';
    }
}
exports.UniversidadNoEncontradaError = UniversidadNoEncontradaError;
