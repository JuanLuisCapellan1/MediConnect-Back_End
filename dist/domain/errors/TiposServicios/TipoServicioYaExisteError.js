"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipoServicioYaExisteError = void 0;
class TipoServicioYaExisteError extends Error {
    constructor(nombre) {
        super(`El tipo de servicio con el nombre '${nombre}' ya existe.`);
        this.name = 'TipoServicioYaExisteError';
    }
}
exports.TipoServicioYaExisteError = TipoServicioYaExisteError;
