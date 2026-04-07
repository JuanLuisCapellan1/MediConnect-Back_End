"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CentroSaludNoEncontradoError = void 0;
class CentroSaludNoEncontradoError extends Error {
    constructor(id) {
        super(`Centro de salud con ID ${id} no encontrado`);
        this.name = 'CentroSaludNoEncontradoError';
    }
}
exports.CentroSaludNoEncontradoError = CentroSaludNoEncontradoError;
