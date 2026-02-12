export class ExequaturYaExisteError extends Error {
    constructor(exequatur: string) {
        super(`Ya existe un doctor con el exequatur: "${exequatur}".`);
        this.name = 'ExequaturYaExisteError';
    }
}
