"use strict";
/**
 * Horario.ts
 * Entidad de dominio que representa un Horario (sin dia_semana — usa horarios_dias)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Horario = void 0;
class Horario {
    constructor(id, doctorId, nombre, horaInicio, horaFin, estado, creadoEn, 
    /** Array de días de la semana (1=Lunes…7=Domingo), poblado desde horarios_dias */
    dias = []) {
        this.id = id;
        this.doctorId = doctorId;
        this.nombre = nombre;
        this.horaInicio = horaInicio;
        this.horaFin = horaFin;
        this.estado = estado;
        this.creadoEn = creadoEn;
        this.dias = dias;
    }
}
exports.Horario = Horario;
