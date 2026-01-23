export class Seccion {
  constructor(
    readonly id: number,
    readonly distritoMunicipalId: number | null,
    readonly nombre: string,
    readonly estado: string,
    readonly creadoEn: Date
  ) {}
}
