import { VerificarValor } from '../../errors/Estados/VerificarValor';
export class EstadoValidator {
    /**
     * @param valor Valor del estado a validar
     * @param estadosValidos Estados válidos permitidos
     * @throws VerificarValor si el valor no es válido
     */
    async validarEstado(valor: string, estadosValidos: string[]): Promise<void> {
        if (!estadosValidos.includes(valor)) {
            throw new VerificarValor(valor, estadosValidos);
        }
    }
}