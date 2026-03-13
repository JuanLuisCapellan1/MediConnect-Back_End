"use strict";
/**
 * GrupoCita.ts
 * Entidad de dominio para citas recurrentes agrupadas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrupoCita = void 0;
class GrupoCita {
    constructor(id, pacienteId, servicioId, horarioId, fechaInicio, fechaFin, estado, creadoEn, descripcion, 
    /** Citas individuales generadas (opcional, se popula con JOIN) */
    citas) {
        this.id = id;
        this.pacienteId = pacienteId;
        this.servicioId = servicioId;
        this.horarioId = horarioId;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.estado = estado;
        this.creadoEn = creadoEn;
        this.descripcion = descripcion;
        this.citas = citas;
    }
}
exports.GrupoCita = GrupoCita;
