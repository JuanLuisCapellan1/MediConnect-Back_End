/**
 * Ubicacion.ts
 * Entidad de dominio que representa una Ubicacion
 * Inmutable — Sus propiedades no deben cambiar después de la creación
 */

export class Ubicacion {
  readonly id: number;
  readonly barrioId: number;
  readonly direccion: string;
  readonly codigoPostal: string | null;
  readonly puntoGeografico: object | null;
  readonly estado: string;
  readonly creadoEn: Date;

  constructor(
    id: number,
    barrioId: number,
    direccion: string,
    estado: string,
    creadoEn: Date,
    codigoPostal: string | null = null,
    puntoGeografico: object | null = null
  ) {
    this.id = id;
    this.barrioId = barrioId;
    this.direccion = direccion;
    this.codigoPostal = codigoPostal;
    this.puntoGeografico = puntoGeografico;
    this.estado = estado;
    this.creadoEn = creadoEn;
  }
}
