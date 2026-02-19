/**
 * ServicioImagen.ts
 * Entidad de dominio para imágenes de un servicio médico
 */

export class ServicioImagen {
    constructor(
        public readonly id: number,
        public readonly servicioId: number,
        public readonly url: string,
        public readonly orden: number,
        public readonly estado: string,
        public readonly creadoEn: Date
    ) { }
}
