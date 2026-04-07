export interface BarrioSeccion {
    id: number;
    nombre: string;
    estado: string;
}

export interface BarrioDistritoMunicipal {
    id: number;
    nombre: string;
    estado: string;
}

export interface BarrioMunicipio {
    id: number;
    nombre: string;
    estado: string;
}

export interface BarrioProvincia {
    id: number;
    nombre: string;
    estado: string;
}

export class Barrio {
    constructor(
        public readonly id: number,
        public readonly seccionId: number,
        public readonly nombre: string,
        public readonly estado: string,
        public readonly creadoEn: Date,
        public readonly geom?: any | null,
        public readonly seccion?: BarrioSeccion | null,
        public readonly distritoMunicipal?: BarrioDistritoMunicipal | null,
        public readonly municipio?: BarrioMunicipio | null,
        public readonly provincia?: BarrioProvincia | null
    ) { }
}
