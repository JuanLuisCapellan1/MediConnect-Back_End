"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MensajeNoEncontradoError = void 0;
class MensajeNoEncontradoError extends Error {
    constructor(id) {
        super(`Mensaje con ID ${id} no encontrado`);
        this.name = 'MensajeNoEncontradoError';
    }
}
exports.MensajeNoEncontradoError = MensajeNoEncontradoError;
