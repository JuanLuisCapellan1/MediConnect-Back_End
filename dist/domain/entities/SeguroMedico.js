"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeguroMedico = void 0;
/**
 * Entidad de dominio para Seguro Médico
 */
class SeguroMedico {
    constructor(id, nombre, estado, creadoEn, urlImage, tiposPermitidos) {
        this.id = id;
        this.nombre = nombre;
        this.urlImage = urlImage;
        this.estado = estado;
        this.creadoEn = creadoEn;
        this.tiposPermitidos = tiposPermitidos;
    }
}
exports.SeguroMedico = SeguroMedico;
