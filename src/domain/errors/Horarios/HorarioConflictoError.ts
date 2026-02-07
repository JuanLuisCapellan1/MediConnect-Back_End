export class HorarioConflictoError extends Error {
  constructor() {
    super('El horario se solapa con otro bloque existente del mismo doctor');
    this.name = 'HorarioConflictoError';
  }
}