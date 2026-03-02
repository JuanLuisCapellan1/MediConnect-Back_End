/**
 * HorarioValidator.ts
 * Validador de reglas de negocio para Horarios
 */

import { inject, injectable } from 'tsyringe';
import { IUsuarioRepository } from '../../repositories/IUsuarioRepository';
import { IHorariosRepository } from '../../repositories/IHorariosRepository';
import { HorarioConflictoError } from '../../errors/Horarios/HorarioConflictoError';

@injectable()
export class HorarioValidator {
  constructor(
    @inject('UsuarioRepository') private usuarioRepository: IUsuarioRepository,
    @inject('HorariosRepository') private horariosRepository: IHorariosRepository
  ) { }

  /**
 * Valida datos del horario y devuelve las horas parseadas.
 * @param diasSemana - Array de días (0=Domingo, 1=Lunes … 6=Sábado), mínimo 1 elemento
 */
  async validarDatosHorario(
    doctorId: number,
    nombre: string,
    diasSemana: number[],
    horaInicio: string,
    horaFin: string,
    excluirId?: number
  ): Promise<{ horaInicioDate: Date; horaFinDate: Date }> {
    if (!doctorId || doctorId <= 0) {
      throw new Error('El ID del doctor es requerido y debe ser válido');
    }

    if (!nombre || nombre.trim().length === 0) {
      throw new Error('El nombre del horario es requerido');
    }

    if (nombre.trim().length > 100) {
      throw new Error('El nombre del horario no puede exceder 100 caracteres');
    }

    if (!Array.isArray(diasSemana) || diasSemana.length === 0) {
      throw new Error('Debe indicar al menos un día de la semana');
    }

    for (const dia of diasSemana) {
      if (!Number.isInteger(dia) || dia < 0 || dia > 6) {
        throw new Error(`Día inválido: ${dia}. Los valores permitidos son 0 (Domingo) a 6 (Sábado)`);
      }
    }

    // Evitar duplicados en el array
    const diasUnicos = [...new Set(diasSemana)];
    if (diasUnicos.length !== diasSemana.length) {
      throw new Error('El array diasSemana contiene días duplicados');
    }

    const usuario = await this.usuarioRepository.buscarPorId(doctorId);
    if (!usuario || usuario.rol !== 'Doctor') {
      throw new Error(`El usuario con ID ${doctorId} no es un Doctor válido`);
    }

    if (usuario.estado !== 'Activo') {
      throw new Error(`El doctor con ID ${doctorId} no está activo`);
    }

    const horaInicioDate = this.parseHora(horaInicio);
    const horaFinDate = this.parseHora(horaFin);

    if (horaFinDate.getTime() <= horaInicioDate.getTime()) {
      throw new Error('La hora de fin debe ser mayor a la hora de inicio');
    }

    return { horaInicioDate, horaFinDate };
  }

  private parseHora(hora: string): Date {
    if (!hora || typeof hora !== 'string') {
      throw new Error('La hora debe ser un string en formato HH:mm o HH:mm:ss');
    }

    const match = hora.match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);
    if (!match) {
      throw new Error('La hora debe tener formato HH:mm o HH:mm:ss');
    }

    const hh = parseInt(match[1], 10);
    const mm = parseInt(match[2], 10);
    const ss = match[3] ? parseInt(match[3], 10) : 0;

    return new Date(Date.UTC(1970, 0, 1, hh, mm, ss, 0));
  }
}