"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MunicipioYaExisteError = void 0;
class MunicipioYaExisteError extends Error {
    constructor(nombre, provinciaId) {
        super(`El municipio "${nombre}" ya existe en la provincia con ID ${provinciaId}`);
        this.name = 'MunicipioYaExisteError';
    }
}
exports.MunicipioYaExisteError = MunicipioYaExisteError;
