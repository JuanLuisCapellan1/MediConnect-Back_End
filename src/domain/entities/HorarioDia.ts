/**
 * HorarioDia.ts
 * Entidad de dominio que representa un día de semana asociado a un Horario
 */

export class HorarioDia {
    constructor(
        public readonly horarioId: number,
        /** Día de la semana: 1=Lunes, 2=Martes, …, 7=Domingo */
        public readonly diaSemana: number
    ) { }
}
