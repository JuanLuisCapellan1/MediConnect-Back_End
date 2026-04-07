/**
 * Horario.ts
 * Entidad de dominio que representa un Horario (sin dia_semana — usa horarios_dias)
 */

export class Horario {
  constructor(
    public readonly id: number,
    public readonly doctorId: number,
    public readonly nombre: string,
    public readonly horaInicio: string,
    public readonly horaFin: string,
    public readonly estado: string,
    public readonly creadoEn: Date,
    /** Array de días de la semana (1=Lunes…7=Domingo), poblado desde horarios_dias */
    public readonly dias: number[] = []
  ) { }
}