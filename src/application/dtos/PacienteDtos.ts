export interface ActualizarPacienteDto {
    nombre?: string;
    apellido?: string;
    telefono?: string;
    fechaNacimiento?: Date;
    genero?: string;
    altura?: number;
    peso?: number;
    tipoSangre?: string;
    ubicacionId?: number;
    estado?: string;
}

export interface FiltroPacientesDto {
    nombre?: string;
    apellido?: string;
    estado?: string;
    genero?: string;
    tipoSangre?: string;
    pagina?: number;
    limite?: number;
}
