"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentoDoctorYaExisteError = void 0;
class DocumentoDoctorYaExisteError extends Error {
    constructor(numeroDocumento) {
        super(`Ya existe un doctor con el número de documento: "${numeroDocumento}".`);
        this.name = 'DocumentoDoctorYaExisteError';
    }
}
exports.DocumentoDoctorYaExisteError = DocumentoDoctorYaExisteError;
