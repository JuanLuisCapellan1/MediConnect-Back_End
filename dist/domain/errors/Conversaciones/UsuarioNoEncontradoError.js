"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuarioNoEncontradoError = void 0;
class UsuarioNoEncontradoError extends Error {
    constructor(usuarioId) {
        super(`Usuario con ID ${usuarioId} no encontrado`);
        this.name = 'UsuarioNoEncontradoError';
    }
}
exports.UsuarioNoEncontradoError = UsuarioNoEncontradoError;
