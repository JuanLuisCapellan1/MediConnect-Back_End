/**
 * GestionarHorariosUseCase.ts
 * Casos de uso para la gestión de Horarios con diasSemana[]
 */

import { Horario } from '../../domain/entities/Horario';
import { IHorariosRepository } from '../../domain/repositories/IHorariosRepository';
import { HorarioValidator } from '../../domain/validators/Horarios/HorarioValidator';
import { EstadoValidator } from '../../domain/validators/Estados/EstadoValidator';
import { CrearHorarioDto, ActualizarHorarioDto } from '../dtos/HorarioDtos';

export class GestionarHorariosUseCase {
  constructor(
    private horariosRepository: IHorariosRepository,
    private horarioValidator: HorarioValidator,
    private estadoValidator: EstadoValidator
  ) { }

  async crear(dto: CrearHorarioDto): Promise<Horario> {
    const { horaInicioDate, horaFinDate } = await this.horarioValidator.validarDatosHorario(
      dto.doctorId,
      dto.nombre,
      dto.diasSemana,
      dto.horaInicio,
      dto.horaFin
    );

    return await this.horariosRepository.crear(
      dto.doctorId,
      dto.nombre.trim(),
      dto.diasSemana,
      horaInicioDate,
      horaFinDate
    );
  }

  async listarTodos(): Promise<Horario[]> {
    return await this.horariosRepository.listarTodos();
  }

  async listarPorDoctor(doctorId: number): Promise<Horario[]> {
    return await this.horariosRepository.listarPorDoctor(doctorId);
  }

  async listarPorDia(diaSemana: number): Promise<Horario[]> {
    return await this.horariosRepository.listarPorDia(diaSemana);
  }

  async buscarPorId(id: number): Promise<Horario | null> {
    return await this.horariosRepository.buscarPorId(id);
  }

  async actualizar(dto: ActualizarHorarioDto): Promise<Horario> {
    const existente = await this.horariosRepository.buscarPorId(dto.id);
    if (!existente) {
      throw new Error(`Horario con ID ${dto.id} no existe`);
    }

    const doctorId = dto.doctorId ?? existente.doctorId;
    const nombre = dto.nombre ?? existente.nombre;
    const diasSemana = dto.diasSemana ?? existente.dias;
    const horaInicio = dto.horaInicio ?? existente.horaInicio;
    const horaFin = dto.horaFin ?? existente.horaFin;

    if (dto.estado) {
      await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo', 'Eliminado']);
    }

    const { horaInicioDate, horaFinDate } = await this.horarioValidator.validarDatosHorario(
      doctorId,
      nombre,
      diasSemana,
      horaInicio,
      horaFin,
      dto.id
    );

    return await this.horariosRepository.actualizar(
      dto.id,
      dto.doctorId,
      dto.nombre?.trim(),
      dto.diasSemana,
      dto.horaInicio ? horaInicioDate : undefined,
      dto.horaFin ? horaFinDate : undefined,
      dto.estado
    );
  }

  async eliminar(id: number, doctorId: number): Promise<Horario> {
    const horario = await this.horariosRepository.buscarPorId(id);
    if (!horario) throw new Error(`Horario con ID ${id} no encontrado`);
    if (horario.doctorId !== doctorId) throw new Error('No tienes permiso para eliminar este horario');
    return await this.horariosRepository.eliminar(id);
  }

  async listarPorEstado(estado: string): Promise<Horario[]> {
    await this.estadoValidator.validarEstado(estado, ['Activo', 'Inactivo', 'Eliminado']);
    return await this.horariosRepository.listarPorEstado(estado);
  }

  private formatearHora(fecha: Date): string {
    const hh = String(fecha.getUTCHours()).padStart(2, '0');
    const mm = String(fecha.getUTCMinutes()).padStart(2, '0');
    const ss = String(fecha.getUTCSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
}