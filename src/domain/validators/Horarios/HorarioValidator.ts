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
   * Valida datos base del horario y devuelve las horas parseadas.
   */
  async validarDatosHorario(
    doctorId: number,
    nombre: string,
    diaSemana: number,
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

    if (diaSemana === undefined || diaSemana < 0 || diaSemana > 6) {
      throw new Error('El día de la semana debe estar entre 0 y 6');
    }

    const usuario = await this.usuarioRepository.buscarPorId(doctorId);
    if (!usuario || !usuario.esDoctor()) {
      throw new Error(`El usuario con ID ${doctorId} no es un Doctor válido`);
    }

    if (!usuario.esActivo()) {
      throw new Error(`El doctor con ID ${doctorId} no está activo`);
    }

    const horaInicioDate = this.parseHora(horaInicio);
    const horaFinDate = this.parseHora(horaFin);

    if (horaFinDate.getTime() <= horaInicioDate.getTime()) {
      throw new Error('La hora de fin debe ser mayor a la hora de inicio');
    }

    const conflicto = await this.horariosRepository.existeConflicto(
      doctorId,
      diaSemana,
      horaInicioDate,
      horaFinDate,
      excluirId
    );

    if (conflicto) {
      throw new HorarioConflictoError();
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