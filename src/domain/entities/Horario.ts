/**
 * Horario.ts
 * Entidad de dominio que representa un Horario
 */

export class Horario {
  constructor(
    public readonly id: number,
    public readonly doctorId: number,
    public readonly nombre: string,
    public readonly diaSemana: number,
    public readonly horaInicio: Date,
    public readonly horaFin: Date,
    public readonly estado: string,
    public readonly creadoEn: Date
  ) { }
}