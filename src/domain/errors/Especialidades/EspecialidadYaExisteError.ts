export class EspecialidadYaExisteError extends Error {
    constructor(nombre: string) {
        super(`Ya existe una especialidad con el nombre: "${nombre}".`);
        this.name = 'EspecialidadYaExisteError';
    }
}
