export interface ActualizarDoctorDto {
    nombre?: string;
    apellido?: string;
    telefono?: string;
    biografia?: string;
    anosExperiencia?: number;
    tarifas?: number;
    duracionCitaPromedio?: number;
    nacionalidad?: string;
    estado?: string;
    fechaNacimiento?: Date;
}

export interface FiltroDoctoresDto {
    nombre?: string;
    apellido?: string;
    especialidadId?: number;
    estado?: string;
    estadoVerificacion?: string;
    genero?: string;
    nacionalidad?: string;
    pagina?: number;
    limite?: number;
}

export interface AgregarIdiomaDto {
    nombre: string;
    nivel?: string;
}

export interface ActualizarIdiomaDto {
    nombre?: string;
    nivel?: string;
}

export interface FiltroDoctoresCercania {
    /** Filtrar por especialidad */
    especialidadId?: number;
    /** Filtrar por género: 'M' | 'F' */
    genero?: string;
    /** Calificación promedio mínima (0–5) */
    calificacionMin?: number;
}
