export class CondicionMedicaNoEncontradaError extends Error {
    constructor(id: number) {
        super(`La condición médica con ID ${id} no fue encontrada.`);
        this.name = 'CondicionMedicaNoEncontradaError';
    }
}
