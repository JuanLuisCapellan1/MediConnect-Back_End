"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorEspecialidadNoEncontradaError = void 0;
class DoctorEspecialidadNoEncontradaError extends Error {
    constructor(idEspecialidad) {
        super(`La especialidad con ID ${idEspecialidad} no está asociada a este doctor.`);
        this.name = 'DoctorEspecialidadNoEncontradaError';
    }
}
exports.DoctorEspecialidadNoEncontradaError = DoctorEspecialidadNoEncontradaError;
