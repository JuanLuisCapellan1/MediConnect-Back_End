export interface CrearFormacionAcademicaDto {
    doctorId?: number; // Se asigna automáticamente desde el JWT en el controller
    universidadId: number;
    especialidadId: number;
    fechaInicio: string; // ISO 8601
    fechaFinalizacion?: string; // ISO 8601
    estado?: string;
}

export interface ActualizarFormacionAcademicaDto {
    universidadId?: number;
    especialidadId?: number;
    fechaInicio?: string; // ISO 8601
    fechaFinalizacion?: string; // ISO 8601
    estado?: string;
}

export interface FiltroFormacionesAcademicasDto {
    doctorId?: number; // Se asigna automáticamente desde el JWT en el controller
    estado?: string;
    busqueda?: string;
    pagina?: number;
    limite?: number;
}
