export class Universidad {
    id!: number;
    paisId!: number;
    nombre!: string;
    estado!: string;
    creadoEn!: Date;
    pais?: any;
    formaciones?: any[];

    constructor(data: Partial<Universidad>) {
        Object.assign(this, data);
    }
}
