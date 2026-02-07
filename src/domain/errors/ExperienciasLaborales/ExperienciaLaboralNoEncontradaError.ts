export class ExperienciaLaboralNoEncontradaError extends Error {
  constructor(id: number) {
    super(`No se encontró la experiencia laboral con ID: ${id}`);
    this.name = 'ExperienciaLaboralNoEncontradaError';
  }
}
