"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarrioYaExisteError = void 0;
class BarrioYaExisteError extends Error {
    constructor(nombre, seccionId) {
        super(`El barrio "${nombre}" ya existe en la sección con ID ${seccionId}`);
        this.name = 'BarrioYaExisteError';
    }
}
exports.BarrioYaExisteError = BarrioYaExisteError;
