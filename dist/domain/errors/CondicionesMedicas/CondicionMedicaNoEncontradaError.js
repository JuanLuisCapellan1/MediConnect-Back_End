"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CondicionMedicaNoEncontradaError = void 0;
class CondicionMedicaNoEncontradaError extends Error {
    constructor(id) {
        super(`La condición médica con ID ${id} no fue encontrada.`);
        this.name = 'CondicionMedicaNoEncontradaError';
    }
}
exports.CondicionMedicaNoEncontradaError = CondicionMedicaNoEncontradaError;
