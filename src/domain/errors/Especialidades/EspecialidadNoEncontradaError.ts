export class EspecialidadNoEncontradaError extends Error {
    constructor(id: number) {
        super(`No se encontró la especialidad con ID: ${id}.`);
        this.name = 'EspecialidadNoEncontradaError';
    }
}
