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

// -------------------------------------------------------
// DTOs para que el doctor gestione SUS propias especialidades
// -------------------------------------------------------

/** PUT /doctores/especialidades — Reemplaza la configuración completa */
export interface ActualizarEspecialidadesDoctorDto {
    id_especialidad_principal: number;
    ids_especialidades_secundarias?: number[];
}

/** Resultado: especialidad del doctor con detalle del catálogo */
export interface EspecialidadDoctorResultadoDto {
    id_especialidad: number;
    nombre: string;
    descripcion?: string | null;
    es_principal: boolean;
    estado: string;
    creado_en: Date;
    actualizado_en?: Date | null;
}
