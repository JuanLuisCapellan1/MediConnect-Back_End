export class DoctorNoEncontradoError extends Error {
    constructor(id: number) {
        super(`No se encontró el doctor con ID: ${id}.`);
        this.name = 'DoctorNoEncontradoError';
    }
}
