/**
 * GestionarHorariosUseCase.ts
 * Casos de uso para la gestión de Horarios
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
  ) {}

  async crear(dto: CrearHorarioDto): Promise<Horario> {
    const { horaInicioDate, horaFinDate } = await this.horarioValidator.validarDatosHorario(
      dto.doctorId,
      dto.nombre,
      dto.diaSemana,
      dto.horaInicio,
      dto.horaFin,
      dto.ubicacionId
    );

    return await this.horariosRepository.crear(
      dto.doctorId,
      dto.nombre.trim(),
      dto.diaSemana,
      horaInicioDate,
      horaFinDate,
      dto.ubicacionId
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
    const diaSemana = dto.diaSemana ?? existente.diaSemana;
    const horaInicio = dto.horaInicio ?? this.formatearHora(existente.horaInicio);
    const horaFin = dto.horaFin ?? this.formatearHora(existente.horaFin);
    const ubicacionId = dto.ubicacionId ?? existente.ubicacionId;

    if (dto.estado) {
      await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo', 'Eliminado']);
    }

    const { horaInicioDate, horaFinDate } = await this.horarioValidator.validarDatosHorario(
      doctorId,
      nombre,
      diaSemana,
      horaInicio,
      horaFin,
      ubicacionId,
      dto.id
    );

    return await this.horariosRepository.actualizar(
      dto.id,
      dto.doctorId,
      dto.nombre?.trim(),
      dto.diaSemana,
      dto.horaInicio ? horaInicioDate : undefined,
      dto.horaFin ? horaFinDate : undefined,
      dto.ubicacionId,
      dto.estado
    );
  }

  async eliminar(id: number): Promise<Horario> {
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