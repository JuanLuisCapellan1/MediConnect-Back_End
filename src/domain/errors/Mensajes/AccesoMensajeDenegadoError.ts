export class AccesoMensajeDenegadoError extends Error {
  constructor(mensajeId: number, usuarioId: number) {
    super(`El usuario ${usuarioId} no tiene acceso al mensaje ${mensajeId}`);
    this.name = 'AccesoMensajeDenegadoError';
  }
}
