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
    nombreDiagnostico: string;
    descripcionDiagnostico: string;
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

/** DTO de filtros para estadísticas de pacientes del doctor */
export interface FiltroEstadisticasPacientesDto {
    /** Fecha desde (YYYY-MM-DD) — filtra por fechaInicio de cita */
    fechaDesde?: string;
    /** Fecha hasta (YYYY-MM-DD) — filtra por fechaInicio de cita */
    fechaHasta?: string;
    /** Filtrar por un servicio específico del doctor */
    servicioId?: number;
}

/** DTO de filtros para estadísticas de citas del doctor */
export interface FiltroEstadisticasCitasDto {
    /** Fecha desde (YYYY-MM-DD) */
    fechaDesde?: string;
    /** Fecha hasta (YYYY-MM-DD) */
    fechaHasta?: string;
    /** Filtrar por un servicio específico del doctor */
    servicioId?: number;
}

/** DTO de respuesta para un paciente que ha agendado con el doctor */
export interface PacienteDelDoctorDto {
    // Información básica del paciente
    pacienteId: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string | null;
    fotoPerfil: string | null;
    
    // Información demográfica
    edad: number;
    genero: string;
    tipoDocIdentificacion: string;
    numeroDocIdentificacion: string;
    peso?: number;
    altura?: number;
    tipoSangre: string | null;
    
    // Información de localización — Ubicación del servicio/centro de la última cita
    ubicacionUltimaCita?: {
        id: number;
        nombre: string | null;
    } | null;
    
    // Información médica
    condiciones: {
        total: number;
        lista: Array<{
            id: number;
            nombre: string;
            tipo: string;
        }>;
    };
    
    // Información de última cita
    ultimaCita: {
        citaId: number;
        fecha: string; // YYYY-MM-DD
        hora: string;  // HH:MM
        estado: string;
        modalidad: string;
        servicio: {
            id: number;
            nombre: string;
            especialidad: {
                id: number;
                nombre: string;
            };
        };
    } | null;
    
    // Total de citas agendadas
    totalCitas: number;
}

/** DTO de filtros para listar pacientes del doctor */
export interface FiltroPacientesDelDoctorDto {
    pagina?: number;
    limite?: number;
    
    // Filtros de búsqueda
    buscar?: string; // Buscar por nombre del paciente, especialidad o servicio
    genero?: string; // Filtrar por género: 'M', 'F'
    
    // Filtros médicos
    tieneCondiciones?: boolean; // Filtrar pacientes que tengan al menos una condición
    tieneAlergias?: boolean; // Filtrar pacientes que tengan al menos una alergia
    
    // Filtros de especialidad y ubicación
    especialidadId?: number; // Filtrar por especialidad de la cita
    servicioId?: number; // Filtrar por servicio específico
    ubicacionId?: number; // Filtrar por ubicación del servicio/centro
    
    // Filtro de fecha de última visita
    ultimaCitaDesde?: string; // Fecha desde (YYYY-MM-DD) — última cita >= esta fecha
    ultimaCitaHasta?: string; // Fecha hasta (YYYY-MM-DD) — última cita <= esta fecha
}
