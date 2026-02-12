"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentoPacienteYaExisteError = void 0;
class DocumentoPacienteYaExisteError extends Error {
    constructor(numeroDocumento) {
        super(`Ya existe un paciente con el número de documento: "${numeroDocumento}".`);
        this.name = 'DocumentoPacienteYaExisteError';
    }
}
exports.DocumentoPacienteYaExisteError = DocumentoPacienteYaExisteError;
