"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversacionMismoUsuarioError = void 0;
class ConversacionMismoUsuarioError extends Error {
    constructor(usuarioId) {
        super(`No puedes crear una conversación contigo mismo (Usuario ID: ${usuarioId})`);
        this.name = 'ConversacionMismoUsuarioError';
    }
}
exports.ConversacionMismoUsuarioError = ConversacionMismoUsuarioError;
