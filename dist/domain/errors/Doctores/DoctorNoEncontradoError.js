"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorNoEncontradoError = void 0;
class DoctorNoEncontradoError extends Error {
    constructor(id) {
        super(`No se encontró el doctor con ID: ${id}.`);
        this.name = 'DoctorNoEncontradoError';
    }
}
exports.DoctorNoEncontradoError = DoctorNoEncontradoError;
