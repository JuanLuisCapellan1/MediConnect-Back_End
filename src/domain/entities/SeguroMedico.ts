/**
 * Entidad de dominio para Seguro Médico
 */
export class SeguroMedico {
    id: number;
    nombre: string;
    urlImage?: string | null;
    estado: string;
    creadoEn: Date;

    constructor(
        id: number,
        nombre: string,
        estado: string,
        creadoEn: Date,
        urlImage?: string | null
    ) {
        this.id = id;
        this.nombre = nombre;
        this.urlImage = urlImage;
        this.estado = estado;
        this.creadoEn = creadoEn;
    }
}
