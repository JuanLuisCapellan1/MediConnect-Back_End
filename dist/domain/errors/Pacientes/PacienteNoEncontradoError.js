"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacienteNoEncontradoError = void 0;
class PacienteNoEncontradoError extends Error {
    constructor(id) {
        super(`No se encontró el paciente con ID: ${id}.`);
        this.name = 'PacienteNoEncontradoError';
    }
}
exports.PacienteNoEncontradoError = PacienteNoEncontradoError;
