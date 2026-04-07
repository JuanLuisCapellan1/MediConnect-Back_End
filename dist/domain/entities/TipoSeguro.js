"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipoSeguro = void 0;
/**
 * Entidad de dominio para Tipo de Seguro
 */
class TipoSeguro {
    constructor(id, nombre, estado, creadoEn, descripcion) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.estado = estado;
        this.creadoEn = creadoEn;
    }
}
exports.TipoSeguro = TipoSeguro;
