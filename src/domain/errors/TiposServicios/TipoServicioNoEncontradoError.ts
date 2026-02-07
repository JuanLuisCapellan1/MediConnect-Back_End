export class TipoServicioNoEncontradoError extends Error {
  constructor(id: number) {
    super(`El tipo de servicio con ID ${id} no fue encontrado.`);
    this.name = 'TipoServicioNoEncontradoError';
  }
}
