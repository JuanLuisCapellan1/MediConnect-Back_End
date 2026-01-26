/**
 * SubBarrio.ts
 * Entidad de dominio que representa un Sub Barrio
 * Inmutable - Sus propiedades no deben cambiar después de la creación
 */

export class SubBarrio {
  readonly id: number;
  readonly barrioId: number;
  readonly nombre: string;
  readonly estado: string;
  readonly creadoEn: Date;

  constructor(
    id: number,
    barrioId: number,
    nombre: string,
    estado: string,
    creadoEn: Date
  ) {
    this.id = id;
    this.barrioId = barrioId;
    this.nombre = nombre;
    this.estado = estado;
    this.creadoEn = creadoEn;
  }
}
