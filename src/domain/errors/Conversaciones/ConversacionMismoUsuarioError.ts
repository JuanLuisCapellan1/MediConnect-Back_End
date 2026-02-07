export class ConversacionMismoUsuarioError extends Error {
  constructor(usuarioId: number) {
    super(`No puedes crear una conversación contigo mismo (Usuario ID: ${usuarioId})`);
    this.name = 'ConversacionMismoUsuarioError';
  }
}
