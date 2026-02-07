import { PrismaClient } from '@prisma/client';
import { IDistritosMunicipalesRepository } from '../../domain/repositories/IDistritosMunicipalesRepository';
import { DistritoMunicipal } from '../../domain/entities/DistritoMunicipal';
import { RedisCacheService } from '../external-services/RedisCacheService';

export class PrismaDistritosMunicipalesRepository implements IDistritosMunicipalesRepository {
  private prisma: PrismaClient;
  private redis: RedisCacheService;
  private readonly CACHE_KEY = 'distritos:listado';
  private readonly CACHE_KEY_POR_MUNICIPIO = (municipioId: number) => `distritos:municipio:${municipioId}`;

  constructor(prisma: PrismaClient, redis: RedisCacheService) {
    this.prisma = prisma;
    this.redis = redis;
  }

  async listarTodas(): Promise<DistritoMunicipal[]> {
    // 1. Intentar obtener de Redis
    const cached = await this.redis.get(this.CACHE_KEY);
    if (cached) return JSON.parse(cached);

    // 2. Si no hay caché, buscar en DB
    const distritosOrm = await this.prisma.distritoMunicipal.findMany({
      where: { estado: { notIn: ['Eliminado', 'Inactivo'] } },
      orderBy: { nombre: 'asc' }
    });

    // 3. Mapear a Entidad de Dominio
    const distritos = distritosOrm.map(d => new DistritoMunicipal(d.id, d.municipioId, d.nombre, d.estado, d.creadoEn));

    // 4. Guardar en Redis (TTL 24 horas porque esto cambia poco)
    await this.redis.set(this.CACHE_KEY, JSON.stringify(distritos), 86400);

    return distritos;
  }

  async listarPorMunicipio(municipioId: number): Promise<DistritoMunicipal[]> {
    const cacheKey = this.CACHE_KEY_POR_MUNICIPIO(municipioId);

    // 1. Intentar obtener de Redis
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // 2. Si no hay caché, buscar en DB
    const distritosOrm = await this.prisma.distritoMunicipal.findMany({
      where: {
        municipioId: municipioId,
        estado: { notIn: ['Eliminado', 'Inactivo'] }
      },
      orderBy: { nombre: 'asc' }
    });

    // 3. Mapear a Entidad de Dominio
    const distritos = distritosOrm.map(d => new DistritoMunicipal(d.id, d.municipioId, d.nombre, d.estado, d.creadoEn));

    // 4. Guardar en Redis
    await this.redis.set(cacheKey, JSON.stringify(distritos), 86400);

    return distritos;
  }

  async crear(municipioId: number, nombre: string): Promise<DistritoMunicipal> {
    const nuevo = await this.prisma.distritoMunicipal.create({
      data: {
        municipioId,
        nombre
      }
    });

    // INVALIDAR CACHÉ: Al cambiar datos, la caché vieja no sirve
    await this.redis.del(this.CACHE_KEY);
    await this.redis.del(this.CACHE_KEY_POR_MUNICIPIO(municipioId));

    return new DistritoMunicipal(nuevo.id, nuevo.municipioId, nuevo.nombre, nuevo.estado, nuevo.creadoEn);
  }

  async buscarPorId(id: number): Promise<DistritoMunicipal | null> {
    const encontrado = await this.prisma.distritoMunicipal.findUnique({
      where: { id: id }
    });
    if (!encontrado) return null;
    return new DistritoMunicipal(encontrado.id, encontrado.municipioId, encontrado.nombre, encontrado.estado, encontrado.creadoEn);
  }

  async buscarPorNombre(nombre: string, municipioId: number, estado: string): Promise<DistritoMunicipal[]> {
    const encontrados = await this.prisma.distritoMunicipal.findMany({
      where: {
        nombre: {
          contains: nombre,
          mode: 'insensitive'
        },
        municipioId: municipioId,
        estado: { equals: estado, mode: 'insensitive' }
      }
    });

    if (!encontrados || encontrados.length === 0) return [];

    return encontrados.map(d => new DistritoMunicipal(d.id, d.municipioId, d.nombre, d.estado, d.creadoEn));
  }

  async buscarPorEstado(estado: string): Promise<DistritoMunicipal[]> {
    const distritosOrm = await this.prisma.distritoMunicipal.findMany({
      where: {
        estado: {
          equals: estado,
          mode: 'insensitive'
        }
      },
      orderBy: { nombre: 'asc' }
    });

    if (!distritosOrm || distritosOrm.length === 0) return [];

    return distritosOrm.map(d => new DistritoMunicipal(d.id, d.municipioId, d.nombre, d.estado, d.creadoEn));
  }

  async actualizar(id: number, municipioId?: number, nombre?: string, estado?: string): Promise<DistritoMunicipal> {
    // Verificar que el distrito exista antes de actualizar
    const distritoExistente = await this.prisma.distritoMunicipal.findUnique({
      where: { id: id }
    });

    if (!distritoExistente) {
      throw new Error(`Distrito municipal con ID ${id} no encontrado`);
    }

    // Validar que el nuevo municipio sea válido si se proporciona
    if (municipioId !== undefined && municipioId !== distritoExistente.municipioId) {
      const municipioExistente = await this.prisma.municipio.findUnique({
        where: { id: municipioId, estado: 'Activo' }
      });

      if (!municipioExistente) {
        throw new Error(`Municipio con ID ${municipioId} no encontrado`);
      }

      if (municipioExistente.estado !== 'Activo') {
        throw new Error(`El municipio con ID ${municipioId} no se encuentra en estado Activo`);
      }
    }
    
    // Guardar el municipioId anterior para invalidar su caché
    const municipioPrevioId = distritoExistente.municipioId;

    // Construir objeto de actualización dinámico (solo campos proporcionados)
    const dataActualizar: any = {};

    if (municipioId !== undefined) {
      dataActualizar.municipioId = municipioId;
    }

    if (nombre !== undefined) {
      dataActualizar.nombre = nombre;
    }

    if (estado !== undefined) {
      dataActualizar.estado = estado;
    }

    const actualizado = await this.prisma.distritoMunicipal.update({
      where: { id: id },
      data: dataActualizar
    });

    // INVALIDAR CACHÉ - Invalidar listado general
    await this.redis.del(this.CACHE_KEY);

    // INVALIDAR CACHÉ - Invalidar caché del municipio anterior (si el municipioId cambió)
    if (municipioId !== undefined && municipioId !== municipioPrevioId) {
      await this.redis.del(this.CACHE_KEY_POR_MUNICIPIO(municipioPrevioId));
    }

    // INVALIDAR CACHÉ - Invalidar caché del municipio actual
    await this.redis.del(this.CACHE_KEY_POR_MUNICIPIO(actualizado.municipioId));

    return new DistritoMunicipal(actualizado.id, actualizado.municipioId, actualizado.nombre, actualizado.estado, actualizado.creadoEn);
  }

  async eliminar(id: number): Promise<DistritoMunicipal> {
    const distritoAEliminar = await this.prisma.distritoMunicipal.findUnique({
      where: { id: id }
    });

    if (!distritoAEliminar) {
      throw new Error(`Distrito municipal con ID ${id} no encontrado`);
    }

    const eliminado = await this.prisma.distritoMunicipal.update({
      where: { id: id },
      data: { estado: 'Eliminado' }
    });

    // INVALIDAR CACHÉ
    await this.redis.del(this.CACHE_KEY);
    await this.redis.del(this.CACHE_KEY_POR_MUNICIPIO(eliminado.municipioId));

    return new DistritoMunicipal(eliminado.id, eliminado.municipioId, eliminado.nombre, eliminado.estado, eliminado.creadoEn);
  }
}
