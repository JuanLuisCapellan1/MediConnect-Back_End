export class DocumentoPacienteYaExisteError extends Error {
    constructor(numeroDocumento: string) {
        super(`Ya existe un paciente con el número de documento: "${numeroDocumento}".`);
        this.name = 'DocumentoPacienteYaExisteError';
    }
}
