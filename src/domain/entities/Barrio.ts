export class Barrio {
    constructor(
        public readonly id: number,
        public readonly seccionId: number,
        public readonly nombre: string,
        public readonly estado: string,
        public readonly creadoEn: Date
    ) {}
}
