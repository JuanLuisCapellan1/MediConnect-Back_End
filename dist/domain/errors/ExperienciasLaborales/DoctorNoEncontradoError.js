"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorNoEncontradoError = void 0;
class DoctorNoEncontradoError extends Error {
    constructor(doctorId) {
        super(`No se encontró el doctor con ID: ${doctorId}`);
        this.name = 'DoctorNoEncontradoError';
    }
}
exports.DoctorNoEncontradoError = DoctorNoEncontradoError;
