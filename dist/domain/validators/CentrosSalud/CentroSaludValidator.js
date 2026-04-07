"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CentroSaludValidator = void 0;
const tsyringe_1 = require("tsyringe");
let CentroSaludValidator = class CentroSaludValidator {
    /**
     * Valida que el nombre comercial sea único (si es necesario)
     */
    async validarNombreUnico(nombre, excluirId) {
        // Implementar según tu lógica
        // Por ahora, es un placeholder
    }
    /**
     * Valida que el RNC sea válido (si se proporciona)
     */
    validarRNC(rnc) {
        if (rnc && rnc.length < 7) {
            throw new Error('El RNC debe ser válido');
        }
    }
    /**
     * Valida el teléfono
     */
    validarTelefono(telefono) {
        const regexTelefono = /^\+?[0-9\s\-\(\)]{10,20}$/;
        if (!regexTelefono.test(telefono)) {
            throw new Error('El teléfono no es válido');
        }
    }
    /**
     * Valida el nombre comercial
     */
    validarNombreComercial(nombre) {
        if (!nombre || nombre.trim().length < 3) {
            throw new Error('El nombre comercial debe tener al menos 3 caracteres');
        }
        if (nombre.length > 120) {
            throw new Error('El nombre comercial no puede exceder 120 caracteres');
        }
    }
    /**
     * Valida la descripción
     */
    validarDescripcion(descripcion) {
        if (descripcion && descripcion.length > 1000) {
            throw new Error('La descripción no puede exceder 1000 caracteres');
        }
    }
};
exports.CentroSaludValidator = CentroSaludValidator;
exports.CentroSaludValidator = CentroSaludValidator = __decorate([
    (0, tsyringe_1.injectable)()
], CentroSaludValidator);
