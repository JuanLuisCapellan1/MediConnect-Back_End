export class MensajeNoEncontradoError extends Error {
  constructor(id: number) {
    super(`Mensaje con ID ${id} no encontrado`);
    this.name = 'MensajeNoEncontradoError';
  }
}
