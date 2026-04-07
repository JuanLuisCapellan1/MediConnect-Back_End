"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccesoMensajeDenegadoError = void 0;
class AccesoMensajeDenegadoError extends Error {
    constructor(mensajeId, usuarioId) {
        super(`El usuario ${usuarioId} no tiene acceso al mensaje ${mensajeId}`);
        this.name = 'AccesoMensajeDenegadoError';
    }
}
exports.AccesoMensajeDenegadoError = AccesoMensajeDenegadoError;
