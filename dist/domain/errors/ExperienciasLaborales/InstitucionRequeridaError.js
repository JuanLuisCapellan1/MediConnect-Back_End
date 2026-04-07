"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstitucionRequeridaError = void 0;
class InstitucionRequeridaError extends Error {
    constructor() {
        super('Debe especificar un centro de salud o una institución externa');
        this.name = 'InstitucionRequeridaError';
    }
}
exports.InstitucionRequeridaError = InstitucionRequeridaError;
