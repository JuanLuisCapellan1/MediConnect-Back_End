export class MediaNoEncontradoError extends Error {
  constructor(id: number) {
    super(`Archivo multimedia con ID ${id} no encontrado`);
    this.name = 'MediaNoEncontradoError';
  }
}
