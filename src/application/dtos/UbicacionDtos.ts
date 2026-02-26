/**
 * UbicacionDtos.ts
 * DTOs para operaciones con Ubicaciones
 */

export interface CrearUbicacionDto {
  barrioId: number;
  direccion: string;
  codigoPostal?: string;
  puntoGeografico: string; // GeoJSON: {"type":"Point","coordinates":[lon,lat]} — OBLIGATORIO
}

export interface ActualizarUbicacionDto {
  id: number;
  barrioId?: number;
  direccion?: string;
  codigoPostal?: string;
  puntoGeografico?: string;
  estado?: string;
}
