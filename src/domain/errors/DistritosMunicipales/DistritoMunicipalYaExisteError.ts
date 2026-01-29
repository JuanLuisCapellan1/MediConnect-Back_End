export class DistritoMunicipalYaExisteError extends Error {
  constructor(nombre: string, municipioId: number) {
    super(`El distrito municipal "${nombre}" ya existe en el municipio con ID ${municipioId}`);
    this.name = 'DistritoMunicipalYaExisteError';
  }
}
