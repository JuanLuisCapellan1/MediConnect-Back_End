"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormacionAcademica = void 0;
class FormacionAcademica {
    constructor(id, doctorId, universidadId, especialidadId, fechaInicio, estado, creadoEn, fechaFinalizacion, actualizadoEn, 
    // Objetos relacionados opcionales
    universidad, especialidad) {
        this.id = id;
        this.doctorId = doctorId;
        this.universidadId = universidadId;
        this.especialidadId = especialidadId;
        this.fechaInicio = fechaInicio;
        this.estado = estado;
        this.creadoEn = creadoEn;
        this.fechaFinalizacion = fechaFinalizacion;
        this.actualizadoEn = actualizadoEn;
        this.universidad = universidad;
        this.especialidad = especialidad;
    }
}
exports.FormacionAcademica = FormacionAcademica;
