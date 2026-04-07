"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CondicionMedica = void 0;
/**
 * Entidad CondicionMedica - Dominio
 */
class CondicionMedica {
    constructor(data) {
        this.id = data.id;
        this.nombre = data.nombre;
        this.descripcion = data.descripcion;
        this.tipo = data.tipo || 'Enfermedad';
        this.estado = data.estado || 'Activa';
        this.creadoEn = data.creadoEn || new Date();
    }
}
exports.CondicionMedica = CondicionMedica;
