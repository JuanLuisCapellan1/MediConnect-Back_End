"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipoCentroSaludYaExisteError = void 0;
class TipoCentroSaludYaExisteError extends Error {
    constructor(nombre) {
        super(`El tipo de centro de salud con el nombre '${nombre}' ya existe.`);
        this.name = 'TipoCentroSaludYaExisteError';
    }
}
exports.TipoCentroSaludYaExisteError = TipoCentroSaludYaExisteError;
