"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversacionNoPermitidaEntreRolesError = void 0;
class ConversacionNoPermitidaEntreRolesError extends Error {
    constructor(rolEmisor, rolReceptor) {
        super(`No se permite crear conversaciones entre usuarios con roles ${rolEmisor} y ${rolReceptor}. ` +
            `Solo se permiten conversaciones entre: Doctor-Paciente, Centro de Salud-Doctor, o Paciente-Centro de Salud.`);
        this.name = 'ConversacionNoPermitidaEntreRolesError';
    }
}
exports.ConversacionNoPermitidaEntreRolesError = ConversacionNoPermitidaEntreRolesError;
