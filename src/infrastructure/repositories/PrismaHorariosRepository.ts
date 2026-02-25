/**
 * PrismaHorariosRepository.ts
 * Repositorio para Horarios — usa horarios_dias (tabla pivote de días de semana)
 */

import { Prisma, PrismaClient } from '@prisma/client';
import { Horario } from '../../domain/entities/Horario';
import { IHorariosRepository } from '../../domain/repositories/IHorariosRepository';
import { HorarioConflictoError } from '../../domain/errors/Horarios/HorarioConflictoError';
import { RedisCacheService } from '../external-services/RedisCacheService';

const HORARIO_INCLUDE = {
  horarios_dias: { select: { dia_semana: true } }
} as const;

export class PrismaHorariosRepository implements IHorariosRepository {
  private prisma: PrismaClient;
  private redis: RedisCacheService;
  private readonly CACHE_KEY = 'horarios:listado';
  private readonly CACHE_KEY_POR_DOCTOR = (doctorId: number) => `horarios:doctor:${doctorId}`;
  private readonly CACHE_KEY_POR_DIA = (diaSemana: number) => `horarios:dia:${diaSemana}`;
  private readonly CACHE_KEY_POR_ESTADO = (estado: string) => `horarios:estado:${estado}`;
  private readonly CACHE_TTL = 24 * 60 * 60;

  constructor(prisma: PrismaClient, redis: RedisCacheService) {
    this.prisma = prisma;
    this.redis = redis;
  }

  async crear(
    doctorId: number,
    nombre: string,
    diasSemana: number[],
    horaInicio: Date,
    horaFin: Date
  ): Promise<Horario> {
    try {
      const creado = await this.prisma.horario.create({
        data: {
          doctorId,
          nombre: nombre.trim(),
          horaInicio,
          horaFin,
          estado: 'Activo',
          horarios_dias: {
            createMany: {
              data: diasSemana.map(dia => ({ dia_semana: dia }))
            }
          }
        },
        include: HORARIO_INCLUDE
      });

      await this.redis.del(this.CACHE_KEY);
      await this.redis.del(this.CACHE_KEY_POR_DOCTOR(doctorId));
      for (const dia of diasSemana) {
        await this.redis.del(this.CACHE_KEY_POR_DIA(dia));
      }

      return this.mapToDomain(creado);
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new HorarioConflictoError();
      }
      throw error;
    }
  }

  async listarTodos(): Promise<Horario[]> {
    const cached = await this.redis.get(this.CACHE_KEY);
    if (cached) {
      return (JSON.parse(cached) as any[]).map(h => this.mapToDomain(h));
    }

    const horariosOrm = await (this.prisma.horario as any).findMany({
      where: { estado: { equals: 'Activo' } },
      include: HORARIO_INCLUDE,
      orderBy: [{ doctorId: 'asc' }, { horaInicio: 'asc' }]
    });

    await this.redis.set(this.CACHE_KEY, JSON.stringify(horariosOrm), this.CACHE_TTL);
    return horariosOrm.map((h: any) => this.mapToDomain(h));
  }

  async listarPorDoctor(doctorId: number): Promise<Horario[]> {
    const cacheKey = this.CACHE_KEY_POR_DOCTOR(doctorId);
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return (JSON.parse(cached) as any[]).map(h => this.mapToDomain(h));
    }

    const horariosOrm = await (this.prisma.horario as any).findMany({
      where: { doctorId, estado: { equals: 'Activo' } },
      include: HORARIO_INCLUDE,
      orderBy: [{ horaInicio: 'asc' }]
    });

    await this.redis.set(cacheKey, JSON.stringify(horariosOrm), this.CACHE_TTL);
    return horariosOrm.map((h: any) => this.mapToDomain(h));
  }

  async listarPorDia(diaSemana: number): Promise<Horario[]> {
    const cacheKey = this.CACHE_KEY_POR_DIA(diaSemana);
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return (JSON.parse(cached) as any[]).map(h => this.mapToDomain(h));
    }

    const horariosOrm = await (this.prisma.horario as any).findMany({
      where: {
        estado: { equals: 'Activo' },
        horarios_dias: { some: { dia_semana: diaSemana } }
      },
      include: HORARIO_INCLUDE,
      orderBy: [{ doctorId: 'asc' }, { horaInicio: 'asc' }]
    });

    await this.redis.set(cacheKey, JSON.stringify(horariosOrm), this.CACHE_TTL);
    return horariosOrm.map((h: any) => this.mapToDomain(h));
  }

  async buscarPorId(id: number): Promise<Horario | null> {
    const horario = await (this.prisma.horario as any).findUnique({
      where: { id },
      include: HORARIO_INCLUDE
    });
    if (!horario) return null;
    return this.mapToDomain(horario);
  }

  async actualizar(
    id: number,
    doctorId?: number,
    nombre?: string,
    diasSemana?: number[],
    horaInicio?: Date,
    horaFin?: Date,
    estado?: string
  ): Promise<Horario> {
    try {
      const horarioExistente = await this.prisma.horario.findUnique({ where: { id } });
      if (!horarioExistente) {
        throw new Error(`Horario con ID ${id} no existe`);
      }

      const dataActualizar: any = {};
      if (doctorId !== undefined) dataActualizar.doctor = { connect: { usuarioId: doctorId } };
      if (nombre !== undefined) dataActualizar.nombre = nombre.trim();
      if (horaInicio !== undefined) dataActualizar.horaInicio = horaInicio;
      if (horaFin !== undefined) dataActualizar.horaFin = horaFin;
      if (estado !== undefined) dataActualizar.estado = estado;

      // Si se actualizan días: reemplazar todos los registros de horarios_dias
      if (diasSemana !== undefined) {
        dataActualizar.horarios_dias = {
          deleteMany: {},
          createMany: {
            data: diasSemana.map(dia => ({ dia_semana: dia }))
          }
        };
      }

      const actualizado = await (this.prisma.horario as any).update({
        where: { id },
        data: dataActualizar,
        include: HORARIO_INCLUDE
      });

      // Invalidar caché
      await this.redis.del(this.CACHE_KEY);
      await this.redis.del(this.CACHE_KEY_POR_DOCTOR(actualizado.doctorId));
      if (doctorId !== undefined && doctorId !== horarioExistente.doctorId) {
        await this.redis.del(this.CACHE_KEY_POR_DOCTOR(horarioExistente.doctorId));
      }

      return this.mapToDomain(actualizado);
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new HorarioConflictoError();
      }
      throw error;
    }
  }

  async eliminar(id: number): Promise<Horario> {
    const horarioAEliminar = await (this.prisma.horario as any).findUnique({
      where: { id },
      include: HORARIO_INCLUDE
    });

    if (!horarioAEliminar) {
      throw new Error(`Horario con ID ${id} no existe`);
    }

    const eliminado = await (this.prisma.horario as any).update({
      where: { id },
      data: { estado: 'Eliminado' },
      include: HORARIO_INCLUDE
    });

    await this.redis.del(this.CACHE_KEY);
    await this.redis.del(this.CACHE_KEY_POR_DOCTOR(eliminado.doctorId));

    return this.mapToDomain(eliminado);
  }

  async listarPorEstado(estado: string): Promise<Horario[]> {
    const cacheKey = this.CACHE_KEY_POR_ESTADO(estado);
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return (JSON.parse(cached) as any[]).map(h => this.mapToDomain(h));
    }

    const horariosOrm = await (this.prisma.horario as any).findMany({
      where: { estado },
      include: HORARIO_INCLUDE,
      orderBy: [{ doctorId: 'asc' }, { horaInicio: 'asc' }]
    });

    await this.redis.set(cacheKey, JSON.stringify(horariosOrm), this.CACHE_TTL);
    return horariosOrm.map((h: any) => this.mapToDomain(h));
  }

  /**
   * Verifica conflicto de horario para el doctor en cualquiera de los días dados.
   * Conflicto = misma hora (solapamiento) en al menos uno de los diasSemana.
   */
  async existeConflicto(
    doctorId: number,
    diasSemana: number[],
    horaInicio: Date,
    horaFin: Date,
    excluirId?: number
  ): Promise<boolean> {
    const conflicto = await (this.prisma.horario as any).findFirst({
      where: {
        doctorId,
        estado: { not: 'Eliminado' },
        ...(excluirId ? { NOT: { id: excluirId } } : {}),
        horarios_dias: { some: { dia_semana: { in: diasSemana } } },
        AND: [
          { horaInicio: { lt: horaFin } },
          { horaFin: { gt: horaInicio } }
        ]
      },
      select: { id: true }
    });

    return Boolean(conflicto);
  }

  private mapToDomain(horario: any): Horario {
    const dias: number[] = (horario.horarios_dias ?? []).map((d: any) => d.dia_semana).sort((a: number, b: number) => a - b);
    return new Horario(
      horario.id,
      horario.doctorId,
      horario.nombre,
      this.dateAHHMM(horario.horaInicio),
      this.dateAHHMM(horario.horaFin),
      horario.estado,
      horario.creadoEn,
      dias
    );
  }

  /** Convierte un Date (o string ISO) al formato "HH:mm" */
  private dateAHHMM(value: Date | string | null | undefined): string {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}