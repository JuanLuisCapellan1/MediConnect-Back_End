export interface CrearUniversidadDto {
    paisId: number;
    nombre: string;
}

export interface ActualizarUniversidadDto {
    nombre?: string;
    paisId?: number;
    estado?: string;
}

export interface FiltroUniversidadesDto {
    paisId?: number;
    estado?: string;
    busqueda?: string;
    pagina?: number;
    limite?: number;
}
