/**
 * SubBarrioDtos.ts
 * DTOs (Data Transfer Objects) para operaciones con Sub Barrios
 * Utilizados en la capa HTTP (Controllers) y Application (Use Cases)
 */

/**
 * DTO para crear un nuevo SubBarrio
 * @property barrioId - ID del barrio al que pertenece el SubBarrio
 * @property nombre - Nombre del SubBarrio (máximo 80 caracteres)
 */
export interface CrearSubBarrioDto {
  barrioId: number;
  nombre: string;
}

/**
 * DTO para actualizar un SubBarrio existente
 * @property id - ID del SubBarrio a actualizar (requerido)
 * @property barrioId - Nuevo ID de barrio (opcional)
 * @property nombre - Nuevo nombre (opcional)
 * @property estado - Nuevo estado (opcional): "Activo", "Inactivo", "Eliminado"
 */
export interface ActualizarSubBarrioDto {
  id: number;
  barrioId?: number;
  nombre?: string;
  estado?: string;
}
