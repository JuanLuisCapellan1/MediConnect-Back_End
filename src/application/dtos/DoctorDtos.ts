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
    /** Filtrar por nombre de idioma (ej. 'inglés') */
    idioma?: string;
    /** Años de experiencia mínimos */
    anosExperienciaMin?: number;
    /** Turno del servicio: 'manana' (06–12), 'tarde' (12–18), 'noche' (18–24) */
    turno?: 'manana' | 'tarde' | 'noche';
    /** Modalidad del servicio: 'Presencial' | 'Virtual' | 'Domicilio' */
    modalidad?: string;
    /** ID de seguro médico aceptado */
    seguroId?: number;
    /** Solo mostrar doctores favoritos del paciente */
    soloFavoritos?: boolean;
}
