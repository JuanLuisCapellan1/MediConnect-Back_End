export class PacienteNoEncontradoError extends Error {
    constructor(id: number) {
        super(`No se encontró el paciente con ID: ${id}.`);
        this.name = 'PacienteNoEncontradoError';
    }
}
