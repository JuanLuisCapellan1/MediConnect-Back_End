/**
 * DTOs para TipoCentroSalud
 */

export interface CrearTipoCentroSaludDto {
  nombre: string;
  estado?: string;
}

export interface ActualizarTipoCentroSaludDto {
  nombre?: string;
  estado?: string;
}

export interface FiltroTiposCentrosSaludDto {
  nombre?: string;
  estado?: string;
  pagina?: number;
  limite?: number;
}
