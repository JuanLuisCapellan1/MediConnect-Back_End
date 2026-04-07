"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeccionYaExisteError = void 0;
class SeccionYaExisteError extends Error {
    constructor(nombre, distritoMunicipalId) {
        let message = `Ya existe una Sección con el nombre "${nombre}"`;
        if (distritoMunicipalId) {
            message += ` en el Distrito Municipal con ID ${distritoMunicipalId}`;
        }
        super(message);
        this.name = 'SeccionYaExisteError';
    }
}
exports.SeccionYaExisteError = SeccionYaExisteError;
