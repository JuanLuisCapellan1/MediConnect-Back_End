import { PrismaClient } from '@prisma/client';
import { IMunicipiosRepository } from '../../domain/repositories/IMunicipiosRepository';
import { Municipio } from '../../domain/entities/Municipio';
import { RedisCacheService } from '../external-services/RedisCacheService';

export class PrismaMunicipiosRepository implements IMunicipiosRepository {
  private prisma: PrismaClient;
  private redis: RedisCacheService;
  private readonly CACHE_KEY = 'municipios:listado';
  private readonly CACHE_KEY_POR_PROVINCIA = (provinciaId: number) => `municipios:provincia:${provinciaId}`;

  constructor(prisma: PrismaClient, redis: RedisCacheService) {
    this.prisma = prisma;
    this.redis = redis;
  }

  async listarTodas(): Promise<Municipio[]> {
    // 1. Intentar obtener de Redis
    const cached = await this.redis.get(this.CACHE_KEY);
    if (cached) return JSON.parse(cached);

    // 2. Si no hay caché, buscar en DB
    const municipiosOrm = await this.prisma.municipio.findMany({
      where: { estado: { notIn: ['Eliminado', 'Inactivo'] } },
      orderBy: { nombre: 'asc' }
    });

    // 3. Mapear a Entidad de Dominio
    const municipios = municipiosOrm.map(m => new Municipio(m.id, m.provinciaId, m.nombre, m.estado, m.creadoEn));

    // 4. Guardar en Redis (TTL 24 horas porque esto cambia poco)
    await this.redis.set(this.CACHE_KEY, JSON.stringify(municipios), 86400);

    return municipios;
  }

  async listarPorProvincia(provinciaId: number): Promise<Municipio[]> {
    const cacheKey = this.CACHE_KEY_POR_PROVINCIA(provinciaId);

    // 1. Intentar obtener de Redis
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // 2. Si no hay caché, buscar en DB
    const municipiosOrm = await this.prisma.municipio.findMany({
      where: {
        provinciaId: provinciaId,
        estado: { notIn: ['Eliminado', 'Inactivo'] }
      },
      orderBy: { nombre: 'asc' }
    });

    // 3. Mapear a Entidad de Dominio
    const municipios = municipiosOrm.map(m => new Municipio(m.id, m.provinciaId, m.nombre, m.estado, m.creadoEn));

    // 4. Guardar en Redis
    await this.redis.set(cacheKey, JSON.stringify(municipios), 86400);

    return municipios;
  }

  async crear(provinciaId: number, nombre: string): Promise<Municipio> {
    const nuevo = await this.prisma.municipio.create({
      data: {
        provinciaId,
        nombre
      }
    });

    // INVALIDAR CACHÉ: Al cambiar datos, la caché vieja no sirve
    await this.redis.del(this.CACHE_KEY);
    await this.redis.del(this.CACHE_KEY_POR_PROVINCIA(provinciaId));

    return new Municipio(nuevo.id, nuevo.provinciaId, nuevo.nombre, nuevo.estado, nuevo.creadoEn);
  }

  async buscarPorId(id: number): Promise<Municipio | null> {
    const encontrado = await this.prisma.municipio.findUnique({
      where: { id: id }
    });
    if (!encontrado) return null;
    return new Municipio(encontrado.id, encontrado.provinciaId, encontrado.nombre, encontrado.estado, encontrado.creadoEn);
  }

  async buscarPorNombre(nombre: string, provinciaId: number, estado: string): Promise<Municipio[]> {
    const encontrados = await this.prisma.municipio.findMany({
      where: {
        nombre: {
          contains: nombre,
          mode: 'insensitive'
        },
        provinciaId: provinciaId,
        estado: { equals: estado, mode: 'insensitive' }
      }
    });

    if (!encontrados || encontrados.length === 0) return [];

    return encontrados.map(m => new Municipio(m.id, m.provinciaId, m.nombre, m.estado, m.creadoEn));
  }

  async buscarPorEstado(estado: string): Promise<Municipio[]> {
    const municipiosOrm = await this.prisma.municipio.findMany({
      where: {
        estado: {
          equals: estado,
          mode: 'insensitive'
        }
      },
      orderBy: { nombre: 'asc' }
    });

    if (!municipiosOrm || municipiosOrm.length === 0) return [];

    return municipiosOrm.map(m => new Municipio(m.id, m.provinciaId, m.nombre, m.estado, m.creadoEn));
  }

  async actualizar(id: number, provinciaId?: number, nombre?: string, estado?: string): Promise<Municipio> {
    // Verificar que el municipio exista antes de actualizar
    const municipioExistente = await this.prisma.municipio.findUnique({
      where: { id: id }
    });

    if (!municipioExistente) {
      throw new Error(`Municipio con ID ${id} no encontrado`);
    }

    // Guardar el provinciaId anterior para invalidar su caché
    const provinciaPreviaId = municipioExistente.provinciaId;

    // Construir objeto de actualización dinámico (solo campos proporcionados)
    const dataActualizar: any = {};

    if (provinciaId !== undefined) {
      dataActualizar.provinciaId = provinciaId;
    }

    if (nombre !== undefined) {
      dataActualizar.nombre = nombre;
    }

    if (estado !== undefined) {
      dataActualizar.estado = estado;
    }

    const actualizado = await this.prisma.municipio.update({
      where: { id: id },
      data: dataActualizar
    });

    // INVALIDAR CACHÉ - Invalidar listado general
    await this.redis.del(this.CACHE_KEY);

    // INVALIDAR CACHÉ - Invalidar caché de la provincia anterior (si el provinciaId cambió)
    if (provinciaId !== undefined && provinciaId !== provinciaPreviaId) {
      await this.redis.del(this.CACHE_KEY_POR_PROVINCIA(provinciaPreviaId));
    }

    // INVALIDAR CACHÉ - Invalidar caché de la provincia actual
    await this.redis.del(this.CACHE_KEY_POR_PROVINCIA(actualizado.provinciaId));

    return new Municipio(actualizado.id, actualizado.provinciaId, actualizado.nombre, actualizado.estado, actualizado.creadoEn);
  }

  async eliminar(id: number): Promise<Municipio> {
    const municipioAEliminar = await this.prisma.municipio.findUnique({
      where: { id: id }
    });

    if (!municipioAEliminar) {
      throw new Error(`Municipio con ID ${id} no encontrado`);
    }

    const eliminado = await this.prisma.municipio.update({
      where: { id: id },
      data: { estado: 'Eliminado' }
    });

    // INVALIDAR CACHÉ
    await this.redis.del(this.CACHE_KEY);
    await this.redis.del(this.CACHE_KEY_POR_PROVINCIA(eliminado.provinciaId));

    return new Municipio(eliminado.id, eliminado.provinciaId, eliminado.nombre, eliminado.estado, eliminado.creadoEn);
  }
}
