"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormacionDuplicadaError = void 0;
class FormacionDuplicadaError extends Error {
    constructor() {
        super('Ya existe una formación académica con la misma universidad y especialidad para este doctor');
        this.name = 'FormacionDuplicadaError';
    }
}
exports.FormacionDuplicadaError = FormacionDuplicadaError;
