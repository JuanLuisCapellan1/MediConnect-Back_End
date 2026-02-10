"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversacionYaExisteError = void 0;
class ConversacionYaExisteError extends Error {
    constructor(emisorId, receptorId) {
        super(`Ya existe una conversación activa entre los usuarios ${emisorId} y ${receptorId}`);
        this.name = 'ConversacionYaExisteError';
    }
}
exports.ConversacionYaExisteError = ConversacionYaExisteError;
