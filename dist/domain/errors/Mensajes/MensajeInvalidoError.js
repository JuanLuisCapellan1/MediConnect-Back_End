"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MensajeInvalidoError = void 0;
class MensajeInvalidoError extends Error {
    constructor(razon) {
        super(`Mensaje inválido: ${razon}`);
        this.name = 'MensajeInvalidoError';
    }
}
exports.MensajeInvalidoError = MensajeInvalidoError;
