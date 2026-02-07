export interface CrearExperienciaLaboralDto {
  doctorId: number;
  centroSaludId?: number;
  institucionExterna?: string;
  profesionId: number;
  descripcionCargo: string;
  fechaInicio: string; // ISO 8601 format
  fechaFinalizacion?: string; // ISO 8601 format
  trabajaActualmente?: boolean;
  estado?: string;
}

export interface ActualizarExperienciaLaboralDto {
  centroSaludId?: number;
  institucionExterna?: string;
  profesionId?: number;
  descripcionCargo?: string;
  fechaInicio?: string; // ISO 8601 format
  fechaFinalizacion?: string; // ISO 8601 format
  trabajaActualmente?: boolean;
  estado?: string;
}

export interface FiltroExperienciasLaboralesDto {
  doctorId?: number;
  centroSaludId?: number;
  profesionId?: number;
  trabajaActualmente?: boolean;
  estado?: string;
  busqueda?: string;
  pagina?: number;
  limite?: number;
}
