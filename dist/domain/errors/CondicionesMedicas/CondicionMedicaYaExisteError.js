"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CondicionMedicaYaExisteError = void 0;
class CondicionMedicaYaExisteError extends Error {
    constructor(nombre) {
        super(`La condición médica "${nombre}" ya existe en el sistema.`);
        this.name = 'CondicionMedicaYaExisteError';
    }
}
exports.CondicionMedicaYaExisteError = CondicionMedicaYaExisteError;
