"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FechasInvalidasError = void 0;
class FechasInvalidasError extends Error {
    constructor(mensaje = 'Las fechas de la experiencia laboral son inválidas') {
        super(mensaje);
        this.name = 'FechasInvalidasError';
    }
}
exports.FechasInvalidasError = FechasInvalidasError;
