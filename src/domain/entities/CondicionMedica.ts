/**
 * Entidad CondicionMedica - Dominio
 */
export class CondicionMedica {
    id: number;
    nombre: string;
    descripcion?: string | null;
    tipo: string;
    estado: string;
    creadoEn: Date;

    constructor(data: {
        id: number;
        nombre: string;
        descripcion?: string | null;
        tipo?: string;
        estado?: string;
        creadoEn?: Date;
    }) {
        this.id = data.id;
        this.nombre = data.nombre;
        this.descripcion = data.descripcion;
        this.tipo = data.tipo || 'Enfermedad';
        this.estado = data.estado || 'Activa';
        this.creadoEn = data.creadoEn || new Date();
    }
}
