"use strict";
/**
 * SubBarrioYaExisteError.ts
 * Error personalizado que se lanza cuando se intenta crear un SubBarrio con un nombre que ya existe en el barrio
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubBarrioYaExisteError = void 0;
class SubBarrioYaExisteError extends Error {
    constructor(nombre, barrioId) {
        super(`El SubBarrio con nombre "${nombre}" ya existe en el barrio con ID ${barrioId}`);
        this.name = 'SubBarrioYaExisteError';
    }
}
exports.SubBarrioYaExisteError = SubBarrioYaExisteError;
