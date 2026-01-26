/**
 * SubBarrioYaExisteError.ts
 * Error personalizado que se lanza cuando se intenta crear un SubBarrio con un nombre que ya existe en el barrio
 */

export class SubBarrioYaExisteError extends Error {
  constructor(nombre: string, barrioId: number) {
    super(
      `El SubBarrio con nombre "${nombre}" ya existe en el barrio con ID ${barrioId}`
    );
    this.name = 'SubBarrioYaExisteError';
  }
}
