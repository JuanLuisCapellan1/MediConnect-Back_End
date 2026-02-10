"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Municipio = void 0;
class Municipio {
    constructor(id, provinciaId, nombre, estado, creadoEn) {
        this.id = id;
        this.provinciaId = provinciaId;
        this.nombre = nombre;
        this.estado = estado;
        this.creadoEn = creadoEn;
    }
}
exports.Municipio = Municipio;
