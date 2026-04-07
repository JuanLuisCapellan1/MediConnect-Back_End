export interface CrearExperienciaLaboralDto {
  doctorId?: number; // Opcional, se asigna desde JWT
  institucion: string;
  posicion: string;
  fechaInicio: string; // ISO 8601 format
  fechaFinalizacion?: string; // ISO 8601 format
  trabajaActualmente?: boolean;
  estado?: string;
}

export interface ActualizarExperienciaLaboralDto {
  institucion?: string;
  posicion?: string;
  fechaInicio?: string; // ISO 8601 format
  fechaFinalizacion?: string; // ISO 8601 format
  trabajaActualmente?: boolean;
  estado?: string;
}

export interface FiltroExperienciasLaboralesDto {
  doctorId?: number; // Se asigna desde JWT
  estado?: string;
  busqueda?: string; // Buscar en institución o posición
  pagina?: number;
  limite?: number;
}
