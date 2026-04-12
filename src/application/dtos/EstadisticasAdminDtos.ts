// ============================================================
// DTOs de respuesta para el dashboard estadístico del Admin
// ============================================================

// Periodos disponibles (igual que el UI: Semana | Mes | 3 Meses | Año | Todo)
export type PeriodoEstadistica = 'semana' | 'mes' | '3meses' | 'año' | 'todo';

export interface RangoFechas {
    inicio: Date;
    fin: Date;
}

// -----------------------------------------------------------
// KPIs: tarjetas superiores

export interface KpiEntidadDto {
    total: number;
    cambioPorcentaje: number; // positivo = crecimiento, negativo = caída
    totalPeriodoAnterior: number;
}

export interface ResumenKpiDto {
    pacientes: KpiEntidadDto;
    doctores: KpiEntidadDto;
    centrosSalud: KpiEntidadDto;
}

// -----------------------------------------------------------
// Gráfico de consultas (barras) — granularidad adaptativa

export interface PuntoTemporalDto {
    etiqueta: string;  // "Lun", "Ene", "Mar 2025", etc.
    total: number;
    fecha?: string;    // ISO opcional para tooltip
}

export interface ConsultasChartDto {
    periodo: PeriodoEstadistica;
    datos: PuntoTemporalDto[];
}

// -----------------------------------------------------------
// Gráfico de usuarios registrados (línea) — granularidad adaptativa

export interface UsuariosChartDto {
    periodo: PeriodoEstadistica;
    datos: PuntoTemporalDto[];
}

// -----------------------------------------------------------
// Gráfico de torta: distribución de servicios

export interface ServicioDistribucionDto {
    nombre: string;
    total: number;
    porcentaje: number;
}

export interface ServiciosDistribucionDto {
    totalCitas: number;
    datos: ServicioDistribucionDto[];
}

// -----------------------------------------------------------
// Gráfico de torta: tipo de consulta (presencial vs teleconsulta)

export interface TipoConsultaDto {
    presencial: number;
    teleconsulta: number;
    totalCitas: number;
    porcentajePresencial: number;
    porcentajeTeleconsulta: number;
}

// -----------------------------------------------------------
// Top especialidades por calificación promedio

export interface EspecialidadTopDto {
    nombre: string;
    calificacionPromedio: number;
    totalResenas: number;
}

export interface TopEspecialidadesDto {
    datos: EspecialidadTopDto[];
}
