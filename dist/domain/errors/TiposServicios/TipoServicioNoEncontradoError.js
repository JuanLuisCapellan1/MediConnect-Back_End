"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipoServicioNoEncontradoError = void 0;
class TipoServicioNoEncontradoError extends Error {
    constructor(id) {
        super(`El tipo de servicio con ID ${id} no fue encontrado.`);
        this.name = 'TipoServicioNoEncontradoError';
    }
}
exports.TipoServicioNoEncontradoError = TipoServicioNoEncontradoError;
