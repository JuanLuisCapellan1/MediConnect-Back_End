export class Municipio {
    constructor(
        public readonly id: number,
        public readonly provinciaId: number,
        public readonly nombre: string,
        public readonly estado: string,
        public readonly creadoEn: Date
    ) {}
}
