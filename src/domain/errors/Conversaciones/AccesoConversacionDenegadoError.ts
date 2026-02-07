export class AccesoConversacionDenegadoError extends Error {
  constructor(conversacionId: number, usuarioId: number) {
    super(`El usuario ${usuarioId} no tiene acceso a la conversación ${conversacionId}`);
    this.name = 'AccesoConversacionDenegadoError';
  }
}
