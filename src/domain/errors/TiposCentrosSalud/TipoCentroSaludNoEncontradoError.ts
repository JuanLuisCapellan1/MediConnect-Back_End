export class TipoCentroSaludNoEncontradoError extends Error {
  constructor(id: number) {
    super(`El tipo de centro de salud con ID ${id} no fue encontrado.`);
    this.name = 'TipoCentroSaludNoEncontradoError';
  }
}
