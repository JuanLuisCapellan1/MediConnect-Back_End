"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvinciaYaExisteError = void 0;
class ProvinciaYaExisteError extends Error {
    constructor(nombre) {
        super(`La provincia "${nombre}" ya existe en el sistema`);
        this.name = 'ProvinciaYaExisteError';
    }
}
exports.ProvinciaYaExisteError = ProvinciaYaExisteError;
