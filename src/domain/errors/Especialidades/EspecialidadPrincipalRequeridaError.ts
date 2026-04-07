export class EspecialidadPrincipalRequeridaError extends Error {
    constructor(mensaje?: string) {
        super(mensaje ?? 'Un doctor debe tener al menos una especialidad principal.');
        this.name = 'EspecialidadPrincipalRequeridaError';
    }
}
