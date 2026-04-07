export class CondicionMedicaYaExisteError extends Error {
    constructor(nombre: string) {
        super(`La condición médica "${nombre}" ya existe en el sistema.`);
        this.name = 'CondicionMedicaYaExisteError';
    }
}
