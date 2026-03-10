/**
 * GestionarHorariosUseCase.ts
 * Casos de uso para la gestión de Horarios con diasSemana[]
 */

import { Horario } from '../../domain/entities/Horario';
import { IHorariosRepository } from '../../domain/repositories/IHorariosRepository';
import { HorarioValidator } from '../../domain/validators/Horarios/HorarioValidator';
import { EstadoValidator } from '../../domain/validators/Estados/EstadoValidator';
import { CrearHorarioDto, ActualizarHorarioDto } from '../dtos/HorarioDtos';
import { EnviarNotificacionUseCase } from './notificaciones/EnviarNotificacionUseCase';

export class GestionarHorariosUseCase {
  constructor(
    private horariosRepository: IHorariosRepository,
    private horarioValidator: HorarioValidator,
    private estadoValidator: EstadoValidator,
    private enviarNotifUC: EnviarNotificacionUseCase,
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

    // ─ Buscar pacientes con citas en este horario y notificarles ──────────────
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const citasAfectadas = await (prisma.cita as any).findMany({
        where: {
          horarioId: id,
          estado: { in: ['Programada', 'Reprogramada'] },
        },
        select: { id: true, pacienteId: true },
      });
      await prisma.$disconnect();

      for (const cita of citasAfectadas) {
        this.enviarNotifUC.execute({
          usuarioId: cita.pacienteId,
          titulo: 'Disponibilidad Médica Modificada',
          mensaje: 'Tu médico ha actualizado su disponibilidad. Por favor revisa el estado de tu cita.',
          tipoAlerta: 'Atencion',
          tipoEntidad: 'Cita',
          entidadId: cita.id,
        }).catch((e: any) => console.error('notif eliminarHorario:', e));
      }
    } catch (e) {
      console.error('GestionarHorariosUseCase.eliminar: error al notificar:', e);
    }

    return await this.horariosRepository.eliminar(id);
  }

  async listarPorEstado(estado: string): Promise<Horario[]> {
    await this.estadoValidator.validarEstado(estado, ['Activo', 'Inactivo', 'Eliminado']);
    return await this.horariosRepository.listarPorEstado(estado);
  }

  /**
   * Verifica si un conjunto de horarios (por ID) presentan conflictos entre sí.
   */
  async verificarConflictos(horarioIds: number[]): Promise<{
    conflicto: boolean;
    mensaje: string;
    detalles: Array<{
      horario1Id: number;
      horario2Id: number;
      diasConflicto: number[];
      mensaje: string;
    }>;
  }> {
    if (!horarioIds || horarioIds.length < 2) {
      return {
        conflicto: false,
        mensaje: 'Se necesitan al menos 2 horarios para comparar.',
        detalles: []
      };
    }

    const horarios: Horario[] = [];
    for (const id of horarioIds) {
      const h = await this.horariosRepository.buscarPorId(id);
      if (!h) throw new Error('Horario con ID ' + id + ' no encontrado');
      horarios.push(h);
    }

    const DIAS: Record<number, string> = {
      1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
      4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo'
    };

    const detalles: Array<{
      horario1Id: number;
      horario2Id: number;
      diasConflicto: number[];
      mensaje: string;
    }> = [];

    for (let i = 0; i < horarios.length; i++) {
      for (let j = i + 1; j < horarios.length; j++) {
        const a = horarios[i];
        const b = horarios[j];

        const diasEnComun = a.dias.filter(d => b.dias.includes(d));
        if (diasEnComun.length === 0) continue;

        const inicioA = this.hhmmmAMinutos(a.horaInicio);
        const finA = this.hhmmmAMinutos(a.horaFin);
        const inicioB = this.hhmmmAMinutos(b.horaInicio);
        const finB = this.hhmmmAMinutos(b.horaFin);

        if (inicioA < finB && finA > inicioB) {
          const diasStr = diasEnComun.map(d => DIAS[d] ?? d).join(', ');
          detalles.push({
            horario1Id: a.id,
            horario2Id: b.id,
            diasConflicto: diasEnComun,
            mensaje: '"' + a.nombre + '" (' + a.horaInicio + '–' + a.horaFin + ') y "' +
              b.nombre + '" (' + b.horaInicio + '–' + b.horaFin + ') se solapan en: ' + diasStr + '.'
          });
        }
      }
    }

    if (detalles.length === 0) {
      return {
        conflicto: false,
        mensaje: 'Los horarios seleccionados no presentan conflictos entre sí.',
        detalles: []
      };
    }

    return {
      conflicto: true,
      mensaje: 'Se encontraron ' + detalles.length + ' conflicto(s) entre los horarios seleccionados.',
      detalles
    };
  }

  /** Convierte "HH:mm" a minutos desde medianoche */
  private hhmmmAMinutos(hhmm: string): number {
    const [hh, mm] = hhmm.split(':').map(Number);
    return hh * 60 + mm;
  }
}