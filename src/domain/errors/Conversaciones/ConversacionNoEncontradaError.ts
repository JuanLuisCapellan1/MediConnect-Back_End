export class ConversacionNoEncontradaError extends Error {
  constructor(id: number) {
    super(`Conversación con ID ${id} no encontrada`);
    this.name = 'ConversacionNoEncontradaError';
  }
}
