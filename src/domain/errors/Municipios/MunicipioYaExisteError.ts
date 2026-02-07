export class MunicipioYaExisteError extends Error {
  constructor(nombre: string, provinciaId: number) {
    super(`El municipio "${nombre}" ya existe en la provincia con ID ${provinciaId}`);
    this.name = 'MunicipioYaExisteError';
  }
}
