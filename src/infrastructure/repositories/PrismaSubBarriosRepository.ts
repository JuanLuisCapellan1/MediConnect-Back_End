/**
 * PrismaSubBarriosRepository.ts
 * Implementación del repositorio para SubBarrios usando Prisma ORM y Redis para caching
 */

import { PrismaClient } from '@prisma/client';
import { RedisCacheService } from '../external-services/RedisCacheService';
import { SubBarrio } from '../../domain/entities/SubBarrio';
import { ISubBarriosRepository } from '../../domain/repositories/ISubBarriosRepository';
import { injectable, inject } from 'tsyringe';

@injectable()
export class PrismaSubBarriosRepository implements ISubBarriosRepository {
  private CACHE_KEY = 'subBarrios:listado';
  private CACHE_KEY_POR_BARRIO = (barrioId: number) => `subBarrios:barrio:${barrioId}`;
  private CACHE_TTL = 24 * 60 * 60; // 24 horas en segundos

  constructor(
    @inject('PrismaClient') private prisma: PrismaClient,
    @inject('RedisCacheService') private cache: RedisCacheService
  ) {}

  /**
   * Crea un nuevo SubBarrio
   */
  async crear(barrioId: number, nombre: string): Promise<SubBarrio> {
    const subBarrio = await this.prisma.subBarrio.create({
      data: {
        barrioId,
        nombre: nombre.trim(),
        estado: 'Activo',
      },
    });

    // Invalidar caché
    await this.invalidarCache(barrioId);

    return new SubBarrio(
      subBarrio.id,
      subBarrio.barrioId,
      subBarrio.nombre,
      subBarrio.estado,
      subBarrio.creadoEn
    );
  }

  /**
   * Lista todos los SubBarrios
   */
  async listarTodos(): Promise<SubBarrio[]> {
    // Intentar obtener del caché
    const cached = await this.cache.get(this.CACHE_KEY);
    if (cached) {
      return JSON.parse(cached).map(
        (sb: any) => new SubBarrio(sb.id, sb.barrioId, sb.nombre, sb.estado, new Date(sb.creadoEn))
      );
    }

    // Si no está en caché, obtener de la BD
    const subBarrios = await this.prisma.subBarrio.findMany({
      where: { estado: { not: 'Eliminado' } },
      orderBy: { id: 'asc' },
    });

    // Guardar en caché
    await this.cache.set(
      this.CACHE_KEY,
      JSON.stringify(subBarrios),
      this.CACHE_TTL
    );

    return subBarrios.map(
      sb => new SubBarrio(sb.id, sb.barrioId, sb.nombre, sb.estado, sb.creadoEn)
    );
  }

  /**
   * Lista todos los SubBarrios de un barrio específico
   */
  async listarPorBarrio(barrioId: number): Promise<SubBarrio[]> {
    const cacheKey = this.CACHE_KEY_POR_BARRIO(barrioId);
    
    // Intentar obtener del caché
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached).map(
        (sb: any) => new SubBarrio(sb.id, sb.barrioId, sb.nombre, sb.estado, new Date(sb.creadoEn))
      );
    }

    // Si no está en caché, obtener de la BD
    const subBarrios = await this.prisma.subBarrio.findMany({
      where: {
        barrioId,
        estado: { not: 'Eliminado' },
      },
      orderBy: { id: 'asc' },
    });

    // Guardar en caché
    await this.cache.set(cacheKey, JSON.stringify(subBarrios), this.CACHE_TTL);

    return subBarrios.map(
      sb => new SubBarrio(sb.id, sb.barrioId, sb.nombre, sb.estado, sb.creadoEn)
    );
  }

  /**
   * Busca un SubBarrio por ID
   */
  async buscarPorId(id: number): Promise<SubBarrio | null> {
    const subBarrio = await this.prisma.subBarrio.findUnique({
      where: { id },
    });

    if (!subBarrio || subBarrio.estado === 'Eliminado') {
      return null;
    }

    return new SubBarrio(
      subBarrio.id,
      subBarrio.barrioId,
      subBarrio.nombre,
      subBarrio.estado,
      subBarrio.creadoEn
    );
  }

  /**
   * Busca SubBarrios por nombre
   */
  async buscarPorNombre(nombre: string): Promise<SubBarrio[]> {
    const subBarrios = await this.prisma.subBarrio.findMany({
      where: {
        nombre: { contains: nombre, mode: 'insensitive' },
        estado: { not: 'Eliminado' },
      },
    });

    return subBarrios.map(
      sb => new SubBarrio(sb.id, sb.barrioId, sb.nombre, sb.estado, sb.creadoEn)
    );
  }

  /**
   * Busca SubBarrios por estado
   */
  async buscarPorEstado(estado: string): Promise<SubBarrio[]> {
    const subBarrios = await this.prisma.subBarrio.findMany({
      where: {
        estado,
      },
    });

    return subBarrios.map(
      sb => new SubBarrio(sb.id, sb.barrioId, sb.nombre, sb.estado, sb.creadoEn)
    );
  }

  /**
   * Actualiza un SubBarrio existente
   */
  async actualizar(
    id: number,
    barrioId?: number,
    nombre?: string,
    estado?: string
  ): Promise<SubBarrio> {
    const subBarrio = await this.prisma.subBarrio.findUnique({ where: { id } });
    if (!subBarrio) {
      throw new Error(`SubBarrio con ID ${id} no existe`);
    }

    const datosActualizacion: any = {};
    if (nombre !== undefined) datosActualizacion.nombre = nombre.trim();
    if (estado !== undefined) datosActualizacion.estado = estado;
    if (barrioId !== undefined) datosActualizacion.barrioId = barrioId;

    const subBarrioActualizado = await this.prisma.subBarrio.update({
      where: { id },
      data: datosActualizacion,
    });

    // Invalidar caché del barrio anterior y nuevo
    const barrioAnterior = subBarrio.barrioId;
    const barrioNuevo = barrioId !== undefined ? barrioId : subBarrio.barrioId;
    await this.invalidarCache(barrioAnterior);
    if (barrioNuevo !== barrioAnterior) {
      await this.invalidarCache(barrioNuevo);
    }

    return new SubBarrio(
      subBarrioActualizado.id,
      subBarrioActualizado.barrioId,
      subBarrioActualizado.nombre,
      subBarrioActualizado.estado,
      subBarrioActualizado.creadoEn
    );
  }

  /**
   * Elimina un SubBarrio (eliminación lógica)
   */
  async eliminar(id: number): Promise<SubBarrio> {
    const subBarrio = await this.prisma.subBarrio.findUnique({ where: { id } });
    if (!subBarrio) {
      throw new Error(`SubBarrio con ID ${id} no existe`);
    }

    // Verificar que no haya ubicaciones asociadas
    const ubicacionesAsociadas = await this.prisma.ubicacion.count({
      where: { subBarrioId: id },
    });

    if (ubicacionesAsociadas > 0) {
      throw new Error(
        `No se puede eliminar el SubBarrio porque tiene ${ubicacionesAsociadas} ubicaciones asociadas`
      );
    }

    // Eliminación lógica
    const subBarrioEliminado = await this.prisma.subBarrio.update({
      where: { id },
      data: { estado: 'Eliminado' },
    });

    // Invalidar caché
    await this.invalidarCache(subBarrio.barrioId);

    return new SubBarrio(
      subBarrioEliminado.id,
      subBarrioEliminado.barrioId,
      subBarrioEliminado.nombre,
      subBarrioEliminado.estado,
      subBarrioEliminado.creadoEn
    );
  }

  /**
   * Invalida todas las claves de caché relacionadas con SubBarrios
   */
  private async invalidarCache(barrioId: number): Promise<void> {
    await Promise.all([
      this.cache.del(this.CACHE_KEY),
      this.cache.del(this.CACHE_KEY_POR_BARRIO(barrioId)),
    ]);
  }
}
