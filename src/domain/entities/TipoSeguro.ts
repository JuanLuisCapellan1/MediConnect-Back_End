/**
 * Entidad de dominio para Tipo de Seguro
 */
export class TipoSeguro {
    id: number;
    nombre: string;
    descripcion?: string | null;
    estado: string;
    creadoEn: Date;

    constructor(
        id: number,
        nombre: string,
        estado: string,
        creadoEn: Date,
        descripcion?: string | null
    ) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.estado = estado;
        this.creadoEn = creadoEn;
    }
}
