export class FormacionDuplicadaError extends Error {
    constructor() {
        super('Ya existe una formación académica con la misma universidad y especialidad para este doctor');
        this.name = 'FormacionDuplicadaError';
    }
}
