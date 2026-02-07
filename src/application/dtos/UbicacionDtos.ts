/**
 * UbicacionDtos.ts
 * DTOs (Data Transfer Objects) para operaciones con Ubicaciones
 * Utilizados en la capa HTTP (Controllers) y Application (Use Cases)
 */

/**
 * DTO para crear una nueva Ubicacion
 * @property barrioId - ID del barrio (requerido)
 * @property subBarrioId - ID del SubBarrio (opcional)
 * @property direccion - Dirección completa (máximo 255 caracteres)
 * @property codigoPostal - Código postal (máximo 10 caracteres, opcional)
 * @property puntoGeografico - Coordenadas geográficas en formato GeoJSON (opcional, PostGIS format)
 */
export interface CrearUbicacionDto {
  barrioId: number;
  subBarrioId?: number;
  direccion: string;
  codigoPostal?: string;
  puntoGeografico?: string; // GeoJSON format: {"type": "Point", "coordinates": [longitude, latitude]}
}

/**
 * DTO para actualizar una Ubicacion existente
 * @property id - ID de la Ubicacion a actualizar (requerido)
 * @property barrioId - Nuevo ID de barrio (opcional)
 * @property subBarrioId - Nuevo ID de SubBarrio (opcional)
 * @property direccion - Nueva dirección (opcional)
 * @property codigoPostal - Nuevo código postal (opcional)
 * @property puntoGeografico - Nuevas coordenadas geográficas (opcional, PostGIS format)
 * @property estado - Nuevo estado (opcional): "Activo", "Inactivo", "Eliminado"
 */
export interface ActualizarUbicacionDto {
  id: number;
  barrioId?: number;
  subBarrioId?: number;
  direccion?: string;
  codigoPostal?: string;
  puntoGeografico?: string; // GeoJSON format: {"type": "Point", "coordinates": [longitude, latitude]}
  estado?: string;
}
