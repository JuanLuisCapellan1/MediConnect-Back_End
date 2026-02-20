"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormacionAcademica = void 0;
class FormacionAcademica {
    constructor(id, doctorId, universidadId, nombre, fechaInicio, estado, creadoEn, fechaFinalizacion, enCurso, actualizadoEn, 
    // Objetos relacionados opcionales
    universidad) {
        this.id = id;
        this.doctorId = doctorId;
        this.universidadId = universidadId;
        this.nombre = nombre;
        this.fechaInicio = fechaInicio;
        this.estado = estado;
        this.creadoEn = creadoEn;
        this.fechaFinalizacion = fechaFinalizacion;
        this.enCurso = enCurso;
        this.actualizadoEn = actualizadoEn;
        this.universidad = universidad;
    }
}
exports.FormacionAcademica = FormacionAcademica;
