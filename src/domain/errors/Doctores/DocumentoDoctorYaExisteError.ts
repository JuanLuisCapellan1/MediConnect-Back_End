export class DocumentoDoctorYaExisteError extends Error {
    constructor(numeroDocumento: string) {
        super(`Ya existe un doctor con el número de documento: "${numeroDocumento}".`);
        this.name = 'DocumentoDoctorYaExisteError';
    }
}
