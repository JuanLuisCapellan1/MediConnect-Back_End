"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FechasFormacionInvalidasError = void 0;
class FechasFormacionInvalidasError extends Error {
    constructor(message) {
        super(message);
        this.name = 'FechasFormacionInvalidasError';
    }
}
exports.FechasFormacionInvalidasError = FechasFormacionInvalidasError;
