export interface CrearEspecialidadDto {
    nombre: string;
    descripcion?: string;
    estado?: string;
}

export interface ActualizarEspecialidadDto {
    nombre?: string;
    descripcion?: string;
    estado?: string;
}

export interface FiltroEspecialidadesDto {
    nombre?: string;
    estado?: string;
    pagina?: number;
    limite?: number;
}
