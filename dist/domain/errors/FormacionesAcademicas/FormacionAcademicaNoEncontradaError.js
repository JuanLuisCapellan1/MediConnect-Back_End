"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormacionAcademicaNoEncontradaError = void 0;
class FormacionAcademicaNoEncontradaError extends Error {
    constructor(id) {
        super(`No se encontró la formación académica con ID: ${id}`);
        this.name = 'FormacionAcademicaNoEncontradaError';
    }
}
exports.FormacionAcademicaNoEncontradaError = FormacionAcademicaNoEncontradaError;
