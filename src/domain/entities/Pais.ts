export class Pais {
    id!: number;
    nombre!: string;
    estado!: string;
    creadoEn!: Date;
    codigo_iso?: string | null;
    universidades?: any[];

    constructor(data: Partial<Pais>) {
        Object.assign(this, data);
    }
}
