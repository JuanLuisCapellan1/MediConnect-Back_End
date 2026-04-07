"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EspecialidadPrincipalRequeridaError = void 0;
class EspecialidadPrincipalRequeridaError extends Error {
    constructor(mensaje) {
        super(mensaje ?? 'Un doctor debe tener al menos una especialidad principal.');
        this.name = 'EspecialidadPrincipalRequeridaError';
    }
}
exports.EspecialidadPrincipalRequeridaError = EspecialidadPrincipalRequeridaError;
