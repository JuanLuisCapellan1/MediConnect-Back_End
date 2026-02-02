/**
 * Validadores para ServicioHorario
 */
import { ServicioHorarioInvalidoError } from '../../errors/ServiciosHorarios/ServicioHorarioInvalidoError';

export class ValidadorServicioHorario {
  /**
   * Valida que los IDs sean válidos
   */
  static validarIds(servicioId: number, horarioId: number): void {
    if (!Number.isInteger(servicioId) || servicioId <= 0) {
      throw new ServicioHorarioInvalidoError(
        'El servicioId debe ser un número entero mayor a 0'
      );
    }

    if (!Number.isInteger(horarioId) || horarioId <= 0) {
      throw new ServicioHorarioInvalidoError(
        'El horarioId debe ser un número entero mayor a 0'
      );
    }
  }

  /**
   * Valida el estado
   */
  static validarEstado(estado: string): void {
    const estadosValidos = ['Activo', 'Inactivo'];
    if (!estadosValidos.includes(estado)) {
      throw new ServicioHorarioInvalidoError(
        `El estado debe ser uno de: ${estadosValidos.join(', ')}`
      );
    }
  }

  /**
   * Valida los datos completos de creación
   */
  static validarCreacion(servicioId: number, horarioId: number): void {
    this.validarIds(servicioId, horarioId);
  }

  /**
   * Valida los datos de actualización
   */
  static validarActualizacion(servicioId?: number, horarioId?: number, estado?: string): void {
    if (servicioId !== undefined) {
      if (!Number.isInteger(servicioId) || servicioId <= 0) {
        throw new ServicioHorarioInvalidoError(
          'El nuevo servicioId debe ser un número entero mayor a 0'
        );
      }
    }

    if (horarioId !== undefined) {
      if (!Number.isInteger(horarioId) || horarioId <= 0) {
        throw new ServicioHorarioInvalidoError(
          'El nuevo horarioId debe ser un número entero mayor a 0'
        );
      }
    }

    if (estado) {
      this.validarEstado(estado);
    }
  }
}
