"use strict";
/**
 * HorarioDia.ts
 * Entidad de dominio que representa un día de semana asociado a un Horario
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HorarioDia = void 0;
class HorarioDia {
    constructor(horarioId, 
    /** Día de la semana: 1=Lunes, 2=Martes, …, 7=Domingo */
    diaSemana) {
        this.horarioId = horarioId;
        this.diaSemana = diaSemana;
    }
}
exports.HorarioDia = HorarioDia;
