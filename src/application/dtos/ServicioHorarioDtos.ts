/**
 * DTOs para ServicioHorario
 */

/**
 * DTO para crear un ServicioHorario
 */
export interface CrearServicioHorarioDto {
  servicioId: number;
  horarioId: number;
  estado?: string;
}

/**
 * DTO para actualizar un ServicioHorario
 */
export interface ActualizarServicioHorarioDto {
  servicioId?: number;
  horarioId?: number;
  estado?: string;
}

/**
 * DTO para respuesta de ServicioHorario
 */
export interface RespuestaServicioHorarioDto {
  servicioId: number;
  horarioId: number;
  estado: string;
  creadoEn: Date;
}

/**
 * DTO para listar ServiciosHorarios con filtros
 */
export interface FiltroServiciosHorariosDto {
  servicioId?: number;
  horarioId?: number;
  estado?: string;
  pagina?: number;
  limite?: number;
}

/**
 * DTO para respuesta paginada
 */
export interface RespuestaPaginadaServiciosHorariosDto {
  datos: RespuestaServicioHorarioDto[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}
