"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExequaturYaExisteError = void 0;
class ExequaturYaExisteError extends Error {
    constructor(exequatur) {
        super(`Ya existe un doctor con el exequatur: "${exequatur}".`);
        this.name = 'ExequaturYaExisteError';
    }
}
exports.ExequaturYaExisteError = ExequaturYaExisteError;
