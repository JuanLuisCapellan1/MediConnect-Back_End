export interface CrearPaisDto {
    nombre: string;
    codigo_iso?: string;
}

export interface ActualizarPaisDto {
    nombre?: string;
    codigo_iso?: string;
    estado?: string;
}

export interface FiltroPaisesDto {
    estado?: string;
    busqueda?: string;
    pagina?: number;
    limite?: number;
}
