export class TipoCentroSaludYaExisteError extends Error {
  constructor(nombre: string) {
    super(`El tipo de centro de salud con el nombre '${nombre}' ya existe.`);
    this.name = 'TipoCentroSaludYaExisteError';
  }
}
