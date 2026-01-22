export class ProvinciaYaExisteError extends Error {
  constructor(nombre: string) {
    super(`La provincia "${nombre}" ya existe en el sistema`);
    this.name = 'ProvinciaYaExisteError';
  }
}
