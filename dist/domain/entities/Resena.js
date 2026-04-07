"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resena = void 0;
/**
 * Resena.ts — Entidad de dominio para Reseñas de servicios médicos
 */
class Resena {
    constructor(id, servicioId, pacienteId, doctorId, calificacion, comentario, estado, creadoEn, actualizadoEn, 
    // Relaciones opcionales
    citaId, paciente, doctor, servicio) {
        this.id = id;
        this.servicioId = servicioId;
        this.pacienteId = pacienteId;
        this.doctorId = doctorId;
        this.calificacion = calificacion;
        this.comentario = comentario;
        this.estado = estado;
        this.creadoEn = creadoEn;
        this.actualizadoEn = actualizadoEn;
        this.citaId = citaId;
        this.paciente = paciente;
        this.doctor = doctor;
        this.servicio = servicio;
    }
}
exports.Resena = Resena;
