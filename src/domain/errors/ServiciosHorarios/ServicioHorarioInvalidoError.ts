/**
 * Error cuando los datos del ServicioHorario son inválidos
 */
export class ServicioHorarioInvalidoError extends Error {
  constructor(mensaje: string) {
    super(`Datos de ServicioHorario inválidos: ${mensaje}`);
    this.name = 'ServicioHorarioInvalidoError';
  }
}
