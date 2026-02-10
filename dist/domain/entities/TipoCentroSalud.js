"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipoCentroSalud = void 0;
/**
 * Entidad TipoCentroSalud - Dominio
 */
class TipoCentroSalud {
    constructor(data) {
        this.id = data.id;
        this.nombre = data.nombre;
        this.estado = data.estado || 'Activo';
        this.creadoEn = data.creadoEn || new Date();
    }
}
exports.TipoCentroSalud = TipoCentroSalud;
