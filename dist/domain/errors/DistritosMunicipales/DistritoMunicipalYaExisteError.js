"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistritoMunicipalYaExisteError = void 0;
class DistritoMunicipalYaExisteError extends Error {
    constructor(nombre, municipioId) {
        super(`El distrito municipal "${nombre}" ya existe en el municipio con ID ${municipioId}`);
        this.name = 'DistritoMunicipalYaExisteError';
    }
}
exports.DistritoMunicipalYaExisteError = DistritoMunicipalYaExisteError;
