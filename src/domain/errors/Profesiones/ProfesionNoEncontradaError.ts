export class ProfesionNoEncontradaError extends Error {
  constructor(id: number) {
    super(`No se encontró la profesión con ID: ${id}`);
    this.name = 'ProfesionNoEncontradaError';
  }
}
