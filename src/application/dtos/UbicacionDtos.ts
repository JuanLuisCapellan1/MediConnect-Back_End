/**
 * UbicacionDtos.ts
 * DTOs para operaciones con Ubicaciones
 */

export interface CrearUbicacionDto {
  barrioId: number;
  direccion: string;
  nombre?: string;
  codigoPostal?: string;
  puntoGeografico: string; // GeoJSON: {"type":"Point","coordinates":[lon,lat]} — OBLIGATORIO
}

export interface ActualizarUbicacionDto {
  id: number;
  barrioId?: number;
  nombre?: string;
  direccion?: string;
  codigoPostal?: string;
  puntoGeografico?: string;
  estado?: string;
}

export interface CrearParaDoctorDto {
  barrioId: number;
  direccion: string;
  nombre?: string;
  codigoPostal?: string;
  puntoGeografico?: string;
}
