"use strict";
/**
 * Ubicacion.ts
 * Entidad de dominio que representa una Ubicacion
 * Inmutable - Sus propiedades no deben cambiar después de la creación
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ubicacion = void 0;
class Ubicacion {
    constructor(id, barrioId, direccion, estado, creadoEn, subBarrioId = null, codigoPostal = null, puntoGeografico = null) {
        this.id = id;
        this.barrioId = barrioId;
        this.subBarrioId = subBarrioId;
        this.direccion = direccion;
        this.codigoPostal = codigoPostal;
        this.puntoGeografico = puntoGeografico;
        this.estado = estado;
        this.creadoEn = creadoEn;
    }
}
exports.Ubicacion = Ubicacion;
