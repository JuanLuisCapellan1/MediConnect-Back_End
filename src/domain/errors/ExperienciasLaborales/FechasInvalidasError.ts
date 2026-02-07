export class FechasInvalidasError extends Error {
  constructor(mensaje: string = 'Las fechas de la experiencia laboral son inválidas') {
    super(mensaje);
    this.name = 'FechasInvalidasError';
  }
}
