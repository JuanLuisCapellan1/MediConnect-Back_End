"use strict";
/**
 * SubBarrio.ts
 * Entidad de dominio que representa un Sub Barrio
 * Inmutable - Sus propiedades no deben cambiar después de la creación
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubBarrio = void 0;
class SubBarrio {
    constructor(id, barrioId, nombre, estado, creadoEn) {
        this.id = id;
        this.barrioId = barrioId;
        this.nombre = nombre;
        this.estado = estado;
        this.creadoEn = creadoEn;
    }
}
exports.SubBarrio = SubBarrio;
