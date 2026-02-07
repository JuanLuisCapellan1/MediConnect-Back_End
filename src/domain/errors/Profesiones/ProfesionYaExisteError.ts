export class ProfesionYaExisteError extends Error {
  constructor(nombre: string) {
    super(`Ya existe una profesión con el nombre: ${nombre}`);
    this.name = 'ProfesionYaExisteError';
  }
}
