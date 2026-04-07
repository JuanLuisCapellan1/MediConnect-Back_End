// ============================================================
// DTOs de respuesta para el dashboard estadístico del Admin
// ============================================================

export interface KpiEntidadDto {
    total: number;
    cambioPorcentaje: number; // positivo = crecimiento, negativo = caída
    totalMesAnterior: number;
}

export interface ResumenKpiDto {
    pacientes: KpiEntidadDto;
    doctores: KpiEntidadDto;
    centrosSalud: KpiEntidadDto;
}

// -----------------------------------------------------------

export interface ConsultaMensualDto {
    mes: number;       // 1-12
    nombreMes: string; // "Ene", "Feb", ...
    total: number;
}

export interface ConsultasMensualesDto {
    anio: number;
    datos: ConsultaMensualDto[];
}

// -----------------------------------------------------------

export interface ActividadMesDto {
    mes: number;
    nombreMes: string;
    usuariosActivos: number;
}

export interface ActividadUsoDto {
    anio: number;
    datos: ActividadMesDto[];
}

// -----------------------------------------------------------

export interface ServicioPopularDto {
    nombre: string;
    total: number;
    porcentaje: number;
}

export interface ServiciosPopularesDto {
    datos: ServicioPopularDto[];
    totalCitas: number;
}

// -----------------------------------------------------------

export interface TeleconsultasVsPresencialesDto {
    presencial: number;
    teleconsulta: number;
    totalCitas: number;
    porcentajePresencial: number;
    porcentajeTeleconsulta: number;
}

// -----------------------------------------------------------

export interface RangoEdadDto {
    rango: string;       // "0-18", "19-30", "31-45", "46-60", "60+"
    pacientes: number;
    doctores: number;
}

export interface PromedioEdadDto {
    promedioEdadPacientes: number;
    promedioEdadDoctores: number;
    distribucion: RangoEdadDto[];
}

// -----------------------------------------------------------
// Query params opcionales

export interface FiltroEstadisticasAnioDto {
    anio?: number;
}

export interface FiltroServiciosPopularesDto {
    limite?: number;
    anio?: number;
}
