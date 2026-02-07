export class VerificarValor extends Error {
    constructor(valor: string, estadosValidos: string[]) {
        super(`El valor "${valor}" no es válido para el estado. Valores válidos: ${estadosValidos.join(', ')}.`);
        this.name = 'VerificarValor';
    }
}