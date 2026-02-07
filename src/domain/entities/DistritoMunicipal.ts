export class DistritoMunicipal {
    constructor(
        public readonly id: number,
        public readonly municipioId: number,
        public readonly nombre: string,
        public readonly estado: string,
        public readonly creadoEn: Date
    ) {}
}
