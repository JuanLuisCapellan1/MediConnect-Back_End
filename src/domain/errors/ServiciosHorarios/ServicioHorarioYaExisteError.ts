/**
 * Error cuando la relación ServicioHorario ya existe
 */
export class ServicioHorarioYaExisteError extends Error {
  constructor(servicioId: number, horarioId: number) {
    super(
      `La relación entre el servicio ${servicioId} y el horario ${horarioId} ya existe.`
    );
    this.name = 'ServicioHorarioYaExisteError';
  }
}
