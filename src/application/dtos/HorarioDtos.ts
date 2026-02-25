/**
 * HorarioDtos.ts
 * DTOs para operaciones con Horarios
 */

/**
 * DTO para crear un nuevo Horario
 * @property diasSemana - Días de la semana (1=Lunes…7=Domingo), mínimo 1 elemento
 */
export interface CrearHorarioDto {
  doctorId: number;
  nombre: string;
  /** Ej: [1, 3, 5] = Lunes, Miércoles, Viernes */
  diasSemana: number[];
  horaInicio: string;
  horaFin: string;
}

/**
 * DTO para actualizar un Horario existente
 */
export interface ActualizarHorarioDto {
  id: number;
  doctorId?: number;
  nombre?: string;
  /** Si se envía, reemplaza todos los días actuales */
  diasSemana?: number[];
  horaInicio?: string;
  horaFin?: string;
  estado?: string;
}