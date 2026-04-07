export class UniversidadNoEncontradaError extends Error {
    constructor(id: number) {
        super(`No se encontró la universidad con ID: ${id}`);
        this.name = 'UniversidadNoEncontradaError';
    }
}
