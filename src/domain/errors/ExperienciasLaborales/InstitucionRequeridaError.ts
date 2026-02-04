export class InstitucionRequeridaError extends Error {
  constructor() {
    super('Debe especificar un centro de salud o una institución externa');
    this.name = 'InstitucionRequeridaError';
  }
}
