export class MensajeInvalidoError extends Error {
  constructor(razon: string) {
    super(`Mensaje inválido: ${razon}`);
    this.name = 'MensajeInvalidoError';
  }
}
