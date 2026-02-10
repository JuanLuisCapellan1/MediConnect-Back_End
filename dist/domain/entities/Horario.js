"use strict";
/**
 * Horario.ts
 * Entidad de dominio que representa un Horario
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Horario = void 0;
class Horario {
    constructor(id, doctorId, nombre, diaSemana, horaInicio, horaFin, ubicacionId, estado, creadoEn) {
        this.id = id;
        this.doctorId = doctorId;
        this.nombre = nombre;
        this.diaSemana = diaSemana;
        this.horaInicio = horaInicio;
        this.horaFin = horaFin;
        this.ubicacionId = ubicacionId;
        this.estado = estado;
        this.creadoEn = creadoEn;
    }
}
exports.Horario = Horario;
