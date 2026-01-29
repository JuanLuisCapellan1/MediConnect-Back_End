export class BarrioYaExisteError extends Error {
  constructor(nombre: string, seccionId: number) {
    super(`El barrio "${nombre}" ya existe en la sección con ID ${seccionId}`);
    this.name = 'BarrioYaExisteError';
  }
}
