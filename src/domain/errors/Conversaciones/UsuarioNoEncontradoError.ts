export class UsuarioNoEncontradoError extends Error {
  constructor(usuarioId: number) {
    super(`Usuario con ID ${usuarioId} no encontrado`);
    this.name = 'UsuarioNoEncontradoError';
  }
}
