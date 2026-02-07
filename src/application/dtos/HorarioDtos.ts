/**
 * HorarioDtos.ts
 * DTOs (Data Transfer Objects) para operaciones con Horarios
 */

/**
 * DTO para crear un nuevo Horario
 * @property doctorId - ID del doctor (requerido)
 * @property nombre - Nombre descriptivo del bloque (requerido)
 * @property diaSemana - Día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)
 * @property horaInicio - Hora de inicio en formato HH:mm o HH:mm:ss
 * @property horaFin - Hora de fin en formato HH:mm o HH:mm:ss
 * @property ubicacionId - ID de la ubicación (requerido)
 */
export interface CrearHorarioDto {
  doctorId: number;
  nombre: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  ubicacionId: number;
}

/**
 * DTO para actualizar un Horario existente
 * @property id - ID del horario a actualizar (requerido)
 * @property doctorId - ID del doctor (opcional)
 * @property nombre - Nombre descriptivo del bloque (opcional)
 * @property diaSemana - Día de la semana (0-6) (opcional)
 * @property horaInicio - Hora de inicio (HH:mm o HH:mm:ss) (opcional)
 * @property horaFin - Hora de fin (HH:mm o HH:mm:ss) (opcional)
 * @property ubicacionId - ID de la ubicación (opcional)
 * @property estado - Estado (Activo, Inactivo, Eliminado) (opcional)
 */
export interface ActualizarHorarioDto {
  id: number;
  doctorId?: number;
  nombre?: string;
  diaSemana?: number;
  horaInicio?: string;
  horaFin?: string;
  ubicacionId?: number;
  estado?: string;
}