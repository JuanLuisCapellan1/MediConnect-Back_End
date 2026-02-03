export class TipoServicioYaExisteError extends Error {
  constructor(nombre: string) {
    super(`El tipo de servicio con el nombre '${nombre}' ya existe.`);
    this.name = 'TipoServicioYaExisteError';
  }
}
