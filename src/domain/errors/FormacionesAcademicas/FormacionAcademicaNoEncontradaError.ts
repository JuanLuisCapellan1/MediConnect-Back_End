export class FormacionAcademicaNoEncontradaError extends Error {
    constructor(id: number) {
        super(`No se encontró la formación académica con ID: ${id}`);
        this.name = 'FormacionAcademicaNoEncontradaError';
    }
}
