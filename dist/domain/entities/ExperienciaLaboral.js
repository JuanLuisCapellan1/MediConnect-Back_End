"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperienciaLaboral = void 0;
class ExperienciaLaboral {
    constructor(id, doctorId, institucion, posicion, fechaInicio, estado, creadoEn, fechaFinalizacion, trabajaActualmente = false, actualizadoEn) {
        this.id = id;
        this.doctorId = doctorId;
        this.institucion = institucion;
        this.posicion = posicion;
        this.fechaInicio = fechaInicio;
        this.estado = estado;
        this.creadoEn = creadoEn;
        this.fechaFinalizacion = fechaFinalizacion;
        this.trabajaActualmente = trabajaActualmente;
        this.actualizadoEn = actualizadoEn;
    }
    /**
     * Valida si la experiencia está actualmente activa
     */
    estaActiva() {
        return this.trabajaActualmente || !this.fechaFinalizacion;
    }
    /**
     * Calcula la duración en meses de la experiencia
     */
    calcularDuracionMeses() {
        const fechaFin = this.trabajaActualmente ? new Date() : (this.fechaFinalizacion || new Date());
        const diffTime = Math.abs(fechaFin.getTime() - this.fechaInicio.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.floor(diffDays / 30);
    }
}
exports.ExperienciaLaboral = ExperienciaLaboral;
