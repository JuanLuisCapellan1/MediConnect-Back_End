"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipoCentroSaludNoEncontradoError = void 0;
class TipoCentroSaludNoEncontradoError extends Error {
    constructor(id) {
        super(`El tipo de centro de salud con ID ${id} no fue encontrado.`);
        this.name = 'TipoCentroSaludNoEncontradoError';
    }
}
exports.TipoCentroSaludNoEncontradoError = TipoCentroSaludNoEncontradoError;
