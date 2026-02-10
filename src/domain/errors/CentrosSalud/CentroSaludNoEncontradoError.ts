export class CentroSaludNoEncontradoError extends Error {
  constructor(id: number) {
    super(`Centro de salud con ID ${id} no encontrado`);
    this.name = 'CentroSaludNoEncontradoError';
  }
}