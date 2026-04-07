"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Barrio = void 0;
class Barrio {
    constructor(id, seccionId, nombre, estado, creadoEn, geom, seccion, distritoMunicipal, municipio, provincia) {
        this.id = id;
        this.seccionId = seccionId;
        this.nombre = nombre;
        this.estado = estado;
        this.creadoEn = creadoEn;
        this.geom = geom;
        this.seccion = seccion;
        this.distritoMunicipal = distritoMunicipal;
        this.municipio = municipio;
        this.provincia = provincia;
    }
}
exports.Barrio = Barrio;
