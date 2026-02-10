"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfesionYaExisteError = void 0;
class ProfesionYaExisteError extends Error {
    constructor(nombre) {
        super(`Ya existe una profesión con el nombre: ${nombre}`);
        this.name = 'ProfesionYaExisteError';
    }
}
exports.ProfesionYaExisteError = ProfesionYaExisteError;
