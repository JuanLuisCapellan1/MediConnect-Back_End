"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstadoValidator = void 0;
const VerificarValor_1 = require("../../errors/Estados/VerificarValor");
class EstadoValidator {
    /**
     * @param valor Valor del estado a validar
     * @param estadosValidos Estados válidos permitidos
     * @throws VerificarValor si el valor no es válido
     */
    async validarEstado(valor, estadosValidos) {
        if (!estadosValidos.includes(valor)) {
            throw new VerificarValor_1.VerificarValor(valor, estadosValidos);
        }
    }
}
exports.EstadoValidator = EstadoValidator;
