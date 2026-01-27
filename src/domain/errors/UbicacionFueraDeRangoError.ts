/**
 * UbicacionFueraDeRangoError.ts
 * Error lanzado cuando la ubicación está fuera del rango operativo
 */

export class UbicacionFueraDeRangoError extends Error {
  constructor(message: string = 'La ubicación especificada está fuera de la zona operativa permitida') {
    super(message);
    this.name = 'UbicacionFueraDeRangoError';
  }
}
