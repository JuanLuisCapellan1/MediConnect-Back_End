export interface CrearFormacionAcademicaDto {
    doctorId?: number; // Se asigna automáticamente desde el JWT en el controller
    universidadId: number;
    nombre: string;
    fechaInicio: string; // ISO 8601
    fechaFinalizacion?: string; // ISO 8601
    enCurso?: boolean; // Si es true, no requiere fechaFinalizacion
    estado?: string;
}

export interface ActualizarFormacionAcademicaDto {
    universidadId?: number;
    nombre?: string;
    fechaInicio?: string; // ISO 8601
    fechaFinalizacion?: string; // ISO 8601
    enCurso?: boolean;
    estado?: string;
}

export interface FiltroFormacionesAcademicasDto {
    doctorId?: number; // Se asigna automáticamente desde el JWT en el controller
    estado?: string;
    busqueda?: string;
    pagina?: number;
    limite?: number;
}
