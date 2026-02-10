"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperienciaLaboral = void 0;
class ExperienciaLaboral {
    constructor(id, doctorId, profesionId, descripcionCargo, fechaInicio, trabajaActualmente, estado, creadoEn, centroSaludId, institucionExterna, fechaFinalizacion, actualizadoEn, 
    // Objetos relacionados opcionales
    profesion, centroSalud) {
        this.id = id;
        this.doctorId = doctorId;
        this.profesionId = profesionId;
        this.descripcionCargo = descripcionCargo;
        this.fechaInicio = fechaInicio;
        this.trabajaActualmente = trabajaActualmente;
        this.estado = estado;
        this.creadoEn = creadoEn;
        this.centroSaludId = centroSaludId;
        this.institucionExterna = institucionExterna;
        this.fechaFinalizacion = fechaFinalizacion;
        this.actualizadoEn = actualizadoEn;
        this.profesion = profesion;
        this.centroSalud = centroSalud;
    }
}
exports.ExperienciaLaboral = ExperienciaLaboral;
