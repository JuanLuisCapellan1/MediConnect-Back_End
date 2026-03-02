export interface CrearCitaDto {
    servicioId: number;
    horarioId: number;
    /** Fecha en formato YYYY-MM-DD (ej: "2026-03-10") */
    fecha: string;
    /** Hora en formato HH:MM, en zona horaria UTC (ej: "09:00") */
    hora: string;
    modalidad: 'Presencial' | 'Virtual' | 'Domicilio';
    numPacientes?: number;
    seguroId?: number;
    tipoSeguroId?: number;
    motivoConsulta?: string;
}

export interface EditarCitaDto {
    servicioId?: number;
    horarioId?: number;
    fecha?: string;
    hora?: string;
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
    /** Fecha en formato YYYY-MM-DD (ej: "2026-03-15") */
    fecha: string;
    /** Hora en formato HH:MM (ej: "10:00") */
    hora: string;
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

/** DTO para que el doctor registre un periodo de inactividad */
export interface CrearPeriodoInactividadDto {
    /** Fecha de inicio en formato YYYY-MM-DD */
    fechaInicio: string;
    /** Hora de inicio en formato HH:MM (UTC). Por defecto 00:00 si no se envía */
    horaInicio?: string;
    /** Fecha de fin en formato YYYY-MM-DD */
    fechaFin: string;
    /** Hora de fin en formato HH:MM (UTC). Por defecto 23:59 si no se envía */
    horaFin?: string;
    motivo?: string;
}
