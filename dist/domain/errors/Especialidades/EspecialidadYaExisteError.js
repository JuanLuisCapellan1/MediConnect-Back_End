"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EspecialidadYaExisteError = void 0;
class EspecialidadYaExisteError extends Error {
    constructor(nombre) {
        super(`Ya existe una especialidad con el nombre: "${nombre}".`);
        this.name = 'EspecialidadYaExisteError';
    }
}
exports.EspecialidadYaExisteError = EspecialidadYaExisteError;
