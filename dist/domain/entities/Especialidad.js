"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Especialidad = void 0;
/**
 * Entidad Especialidad - Dominio
 */
class Especialidad {
    constructor(data) {
        this.id = data.id;
        this.nombre = data.nombre;
        this.descripcion = data.descripcion;
        this.estado = data.estado || 'Activo';
        this.creadoEn = data.creadoEn || new Date();
    }
}
exports.Especialidad = Especialidad;
