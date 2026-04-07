"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversacionNoEncontradaError = void 0;
class ConversacionNoEncontradaError extends Error {
    constructor(id) {
        super(`Conversación con ID ${id} no encontrada`);
        this.name = 'ConversacionNoEncontradaError';
    }
}
exports.ConversacionNoEncontradaError = ConversacionNoEncontradaError;
