export class DoctorNoEncontradoError extends Error {
  constructor(doctorId: number) {
    super(`No se encontró el doctor con ID: ${doctorId}`);
    this.name = 'DoctorNoEncontradoError';
  }
}
