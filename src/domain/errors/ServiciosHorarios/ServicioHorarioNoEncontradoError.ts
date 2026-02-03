/**
 * Error cuando no se encuentra la relación ServicioHorario
 */
export class ServicioHorarioNoEncontradoError extends Error {
  constructor(servicioId: number, horarioId: number) {
    super(
      `No se encontró la relación entre el servicio ${servicioId} y el horario ${horarioId}.`
    );
    this.name = 'ServicioHorarioNoEncontradoError';
  }
}
