export interface CrearTipoServicioDto {
  nombre: string;
  descripcion?: string;
  estado?: string;
}

export interface ActualizarTipoServicioDto {
  nombre?: string;
  descripcion?: string;
  estado?: string;
}

export interface FiltroTiposServiciosDto {
  nombre?: string;
  estado?: string;
  pagina?: number;
  limite?: number;
}
