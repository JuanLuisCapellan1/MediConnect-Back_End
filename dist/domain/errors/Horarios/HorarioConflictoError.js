"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HorarioConflictoError = void 0;
class HorarioConflictoError extends Error {
    constructor() {
        super('El horario se solapa con otro bloque existente del mismo doctor');
        this.name = 'HorarioConflictoError';
    }
}
exports.HorarioConflictoError = HorarioConflictoError;
