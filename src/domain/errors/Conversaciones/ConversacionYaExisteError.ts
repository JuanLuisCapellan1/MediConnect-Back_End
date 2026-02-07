export class ConversacionYaExisteError extends Error {
  constructor(emisorId: number, receptorId: number) {
    super(`Ya existe una conversación activa entre los usuarios ${emisorId} y ${receptorId}`);
    this.name = 'ConversacionYaExisteError';
  }
}
