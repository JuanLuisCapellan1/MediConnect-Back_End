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
