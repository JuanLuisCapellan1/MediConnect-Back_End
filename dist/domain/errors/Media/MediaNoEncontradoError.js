"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaNoEncontradoError = void 0;
class MediaNoEncontradoError extends Error {
    constructor(id) {
        super(`Archivo multimedia con ID ${id} no encontrado`);
        this.name = 'MediaNoEncontradoError';
    }
}
exports.MediaNoEncontradoError = MediaNoEncontradoError;
