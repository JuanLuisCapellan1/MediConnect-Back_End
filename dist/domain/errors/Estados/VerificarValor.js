"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificarValor = void 0;
class VerificarValor extends Error {
    constructor(valor, estadosValidos) {
        super(`El valor "${valor}" no es válido para el estado. Valores válidos: ${estadosValidos.join(', ')}.`);
        this.name = 'VerificarValor';
    }
}
exports.VerificarValor = VerificarValor;
