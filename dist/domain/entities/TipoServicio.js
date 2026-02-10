"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipoServicio = void 0;
/**
 * Entidad TipoServicio - Dominio
 */
class TipoServicio {
    constructor(data) {
        this.id = data.id;
        this.nombre = data.nombre;
        this.descripcion = data.descripcion;
        this.estado = data.estado || 'Activo';
        this.creadoEn = data.creadoEn || new Date();
    }
}
exports.TipoServicio = TipoServicio;
