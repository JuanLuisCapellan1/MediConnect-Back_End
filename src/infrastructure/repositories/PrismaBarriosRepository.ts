import { PrismaClient } from '@prisma/client';
import { IBarriosRepository } from '../../domain/repositories/IBarriosRepository';
import { Barrio } from '../../domain/entities/Barrio';
import { RedisCacheService } from '../external-services/RedisCacheService';

export class PrismaBarriosRepository implements IBarriosRepository {
  private prisma: PrismaClient;
  private redis: RedisCacheService;
  private readonly CACHE_KEY = 'barrios:listado';
  private readonly CACHE_KEY_POR_SECCION = (seccionId: number) => `barrios:seccion:${seccionId}`;

  constructor(prisma: PrismaClient, redis: RedisCacheService) {
    this.prisma = prisma;
    this.redis = redis;
  }

  async listarTodas(): Promise<Barrio[]> {
    // 1. Intentar obtener de Redis
    const cached = await this.redis.get(this.CACHE_KEY);
    if (cached) return JSON.parse(cached);

    // 2. Si no hay caché, buscar en DB
    const barriosOrm = await this.prisma.barrio.findMany({
      where: { estado: { notIn: ['Eliminado', 'Inactivo'] } },
      orderBy: { nombre: 'asc' }
    });

    // 3. Mapear a Entidad de Dominio
    const barrios = barriosOrm.map(b => new Barrio(b.id, b.seccionId, b.nombre, b.estado, b.creadoEn));

    // 4. Guardar en Redis (TTL 24 horas porque esto cambia poco)
    await this.redis.set(this.CACHE_KEY, JSON.stringify(barrios), 86400);

    return barrios;
  }

  async listarPorSeccion(seccionId: number): Promise<Barrio[]> {
    const cacheKey = this.CACHE_KEY_POR_SECCION(seccionId);

    // 1. Intentar obtener de Redis
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // 2. Si no hay caché, buscar en DB
    const barriosOrm = await this.prisma.barrio.findMany({
      where: {
        seccionId: seccionId,
        estado: { notIn: ['Eliminado', 'Inactivo'] }
      },
      orderBy: { nombre: 'asc' }
    });

    // 3. Mapear a Entidad de Dominio
    const barrios = barriosOrm.map(b => new Barrio(b.id, b.seccionId, b.nombre, b.estado, b.creadoEn));

    // 4. Guardar en Redis
    await this.redis.set(cacheKey, JSON.stringify(barrios), 86400);

    return barrios;
  }

  async crear(seccionId: number, nombre: string): Promise<Barrio> {
    const nuevo = await this.prisma.barrio.create({
      data: {
        seccionId,
        nombre
      }
    });

    // INVALIDAR CACHÉ: Al cambiar datos, la caché vieja no sirve
    await this.redis.del(this.CACHE_KEY);
    await this.redis.del(this.CACHE_KEY_POR_SECCION(seccionId));

    return new Barrio(nuevo.id, nuevo.seccionId, nuevo.nombre, nuevo.estado, nuevo.creadoEn);
  }

  async buscarPorId(id: number): Promise<Barrio | null> {
    const encontrado = await this.prisma.barrio.findUnique({
      where: { id: id }
    });
    if (!encontrado) return null;
    return new Barrio(encontrado.id, encontrado.seccionId, encontrado.nombre, encontrado.estado, encontrado.creadoEn);
  }

  async buscarPorNombre(nombre: string, seccionId: number, estado: string): Promise<Barrio[]> {
    const encontrados = await this.prisma.barrio.findMany({
      where: {
        nombre: {
          contains: nombre,
          mode: 'insensitive'
        },
        seccionId: seccionId,
        estado: { equals: estado, mode: 'insensitive' }
      }
    });

    if (!encontrados || encontrados.length === 0) return [];

    return encontrados.map(b => new Barrio(b.id, b.seccionId, b.nombre, b.estado, b.creadoEn));
  }

  async buscarPorEstado(estado: string): Promise<Barrio[]> {
    const barriosOrm = await this.prisma.barrio.findMany({
      where: {
        estado: {
          equals: estado,
          mode: 'insensitive'
        }
      },
      orderBy: { nombre: 'asc' }
    });

    if (!barriosOrm || barriosOrm.length === 0) return [];

    return barriosOrm.map(b => new Barrio(b.id, b.seccionId, b.nombre, b.estado, b.creadoEn));
  }

  async actualizar(id: number, seccionId?: number, nombre?: string, estado?: string): Promise<Barrio> {
    // Verificar que el barrio exista antes de actualizar
    const barrioExistente = await this.prisma.barrio.findUnique({
      where: { id: id }
    });

    if (!barrioExistente) {
      throw new Error(`Barrio con ID ${id} no encontrado`);
    }

    // Validar que la nueva sección sea válida si se proporciona
    if (seccionId !== undefined && seccionId !== barrioExistente.seccionId) {
      const seccionExistente = await this.prisma.seccion.findUnique({
        where: { id: seccionId, estado: 'Activo' }
      });

      if (!seccionExistente) {
        throw new Error(`Sección con ID ${seccionId} no encontrada`);
      }

      if (seccionExistente.estado !== 'Activo') {
        throw new Error(`La sección con ID ${seccionId} no se encuentra en estado Activo`);
      }
    }

    // Guardar el seccionId anterior para invalidar su caché
    const seccionPreviaId = barrioExistente.seccionId;

    // Construir objeto de actualización dinámico (solo campos proporcionados)
    const dataActualizar: any = {};

    if (seccionId !== undefined) {
      dataActualizar.seccionId = seccionId;
    }
    if (nombre !== undefined) {
      dataActualizar.nombre = nombre;
    }
    if (estado !== undefined) {
      dataActualizar.estado = estado;
    }

    // Ejecutar la actualización
    const actualizado = await this.prisma.barrio.update({
      where: { id: id },
      data: dataActualizar
    });

    // INVALIDAR CACHÉ
    await this.redis.del(this.CACHE_KEY);
    await this.redis.del(this.CACHE_KEY_POR_SECCION(seccionPreviaId));
    
    // Si cambió de sección, también invalidar la caché de la nueva sección
    if (seccionId !== undefined && seccionId !== seccionPreviaId) {
      await this.redis.del(this.CACHE_KEY_POR_SECCION(seccionId));
    }

    return new Barrio(actualizado.id, actualizado.seccionId, actualizado.nombre, actualizado.estado, actualizado.creadoEn);
  }

  async eliminar(id: number): Promise<Barrio> {
    // Verificar que el barrio exista antes de eliminar
    const barrioExistente = await this.prisma.barrio.findUnique({
      where: { id: id }
    });

    if (!barrioExistente) {
      throw new Error(`Barrio con ID ${id} no encontrado`);
    }

    // Validar que no tenga sub-barrios o ubicaciones
    const tieneSubBarrios = await this.prisma.subBarrio.count({
      where: { barrioId: id }
    });

    if (tieneSubBarrios > 0) {
      throw new Error(`No se puede eliminar el barrio porque tiene ${tieneSubBarrios} sub-barrio(s) asociado(s)`);
    }

    const tieneUbicaciones = await this.prisma.ubicacion.count({
      where: { barrioId: id }
    });

    if (tieneUbicaciones > 0) {
      throw new Error(`No se puede eliminar el barrio porque tiene ${tieneUbicaciones} ubicación(es) asociada(s)`);
    }

    // Realizar la eliminación lógica (cambiar a estado Eliminado)
    const eliminado = await this.prisma.barrio.update({
      where: { id: id },
      data: { estado: 'Eliminado' }
    });

    // INVALIDAR CACHÉ
    await this.redis.del(this.CACHE_KEY);
    await this.redis.del(this.CACHE_KEY_POR_SECCION(barrioExistente.seccionId));

    return new Barrio(eliminado.id, eliminado.seccionId, eliminado.nombre, eliminado.estado, eliminado.creadoEn);
  }
}
