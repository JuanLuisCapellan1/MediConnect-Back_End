export interface CrearCitaDto {
    servicioId: number;
    horarioId: number;
    fechaInicio: string | Date;
    fechaFin: string | Date;
    modalidad: 'Presencial' | 'Virtual' | 'Domicilio';
    numPacientes?: number;
    seguroId?: number;
    tipoSeguroId?: number;
    motivoConsulta?: string;
}

export interface EditarCitaDto {
    servicioId?: number;
    horarioId?: number;
    fechaInicio?: string | Date;
    fechaFin?: string | Date;
    modalidad?: 'Presencial' | 'Virtual' | 'Domicilio';
    numPacientes?: number;
    seguroId?: number | null;
    tipoSeguroId?: number | null;
    motivoConsulta?: string;
}

export interface CancelarCitaDto {
    motivoCancelacion: string;
}

export interface ReprogramarCitaDto {
    horarioId: number;
    fechaInicio: string | Date;
    fechaFin: string | Date;
}

export interface DiagnosticarCitaDto {
    resumen: string;
    diagnostico: string;
    tratamiento?: string;
    observacion?: string;
}

export interface FiltroCitasDto {
    estado?: string;
    pagina?: number;
    limite?: number;
    fechaDesde?: string | Date;
    fechaHasta?: string | Date;
}

/** DTO para crear un grupo de citas recurrentes */
export interface CrearCitaRecurrenteDto {
    servicioId: number;
    horarioId: number;
    modalidad: 'Presencial' | 'Virtual' | 'Domicilio';
    /** Fecha de inicio del ciclo recurrente (YYYY-MM-DD) */
    fechaInicio: string | Date;
    /** Fecha fin del ciclo (YYYY-MM-DD). Si no se envía, ciclo indefinido de 3 meses */
    fechaFin?: string | Date;
    numPacientes?: number;
    seguroId?: number;
    tipoSeguroId?: number;
    motivoConsulta?: string;
    descripcion?: string;
}
