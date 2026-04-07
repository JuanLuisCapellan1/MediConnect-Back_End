"use strict";
/**
 * ServicioImagen.ts
 * Entidad de dominio para imágenes de un servicio médico
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicioImagen = void 0;
class ServicioImagen {
    constructor(id, servicioId, url, orden, estado, creadoEn) {
        this.id = id;
        this.servicioId = servicioId;
        this.url = url;
        this.orden = orden;
        this.estado = estado;
        this.creadoEn = creadoEn;
    }
}
exports.ServicioImagen = ServicioImagen;
