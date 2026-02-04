export interface CrearProfesionDto {
  nombre: string;
  descripcion?: string;
  estado?: string;
}

export interface ActualizarProfesionDto {
  nombre?: string;
  descripcion?: string;
  estado?: string;
}

export interface FiltroProfesionesDto {
  estado?: string;
  busqueda?: string;
  pagina?: number;
  limite?: number;
}
