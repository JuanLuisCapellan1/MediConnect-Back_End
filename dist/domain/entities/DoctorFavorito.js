"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorFavorito = void 0;
/**
 * DoctorFavorito.ts — Entidad de dominio
 */
class DoctorFavorito {
    constructor(pacienteId, doctorId, agregadoEn, estado, 
    /** Datos enriquecidos del doctor (opcionales, se cargan en consultas de listado) */
    doctor) {
        this.pacienteId = pacienteId;
        this.doctorId = doctorId;
        this.agregadoEn = agregadoEn;
        this.estado = estado;
        this.doctor = doctor;
    }
    toJSON() {
        return {
            pacienteId: this.pacienteId,
            doctorId: this.doctorId,
            agregadoEn: this.agregadoEn,
            estado: this.estado,
            doctor: this.doctor ?? undefined,
        };
    }
}
exports.DoctorFavorito = DoctorFavorito;
