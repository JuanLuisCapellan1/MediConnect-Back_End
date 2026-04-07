"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccesoConversacionDenegadoError = void 0;
class AccesoConversacionDenegadoError extends Error {
    constructor(conversacionId, usuarioId) {
        super(`El usuario ${usuarioId} no tiene acceso a la conversación ${conversacionId}`);
        this.name = 'AccesoConversacionDenegadoError';
    }
}
exports.AccesoConversacionDenegadoError = AccesoConversacionDenegadoError;
