import { PrismaClient } from '@prisma/client';
import { IProvinciasRepository } from '../../domain/repositories/IProvinciasRepository';
import { Provincias } from '../../domain/entities/Provincias';   
import { RedisCacheService } from '../external-services/RedisCacheService';

export class PrismaProvinciasRepository implements IProvinciasRepository {
  private prisma: PrismaClient;
  private redis: RedisCacheService;
  private readonly CACHE_KEY = 'provincias:listado';

  constructor(prisma: PrismaClient, redis: RedisCacheService) {
    this.prisma = prisma;
    this.redis = redis;
  }

  async listarTodas(): Promise<Provincias[]> {
    // 1. Intentar obtener de Redis
    const cached = await this.redis.get(this.CACHE_KEY);
    if (cached) return JSON.parse(cached);

    // 2. Si no hay caché, buscar en DB
    const provinciasOrm = await this.prisma.provincia.findMany({
      where: { estado: { notIn: ['Eliminado', 'Inactivo'] } },
      orderBy: { nombre: 'asc' }
    });

    // 3. Mapear a Entidad de Dominio
    const provincias = provinciasOrm.map(p => new Provincias(p.id, p.nombre, p.estado, p.creadoEn));

    // 4. Guardar en Redis (TTL 24 horas porque esto cambia poco)
    await this.redis.set(this.CACHE_KEY, JSON.stringify(provincias), 86400);

    return provincias;
  }

  async crear(nombre: string): Promise<Provincias> {
    const nueva = await this.prisma.provincia.create({
      data: { nombre }
    });

    // INVALIDAR CACHÉ: Al cambiar datos, la caché vieja no sirve
    await this.redis.del(this.CACHE_KEY);

    return new Provincias(nueva.id, nueva.nombre, nueva.estado, nueva.creadoEn);
  }

  async buscarPorId(id: number): Promise<Provincias | null> {
    const encontrada = await this.prisma.provincia.findUnique({
      where: { id: id }
    });
    if (!encontrada) return null;
    return new Provincias(encontrada.id, encontrada.nombre, encontrada.estado, encontrada.creadoEn);
  }

  async buscarPorNombre(nombre: string, estado: string): Promise<Provincias[]> {
    const encontrada = await this.prisma.provincia.findMany({
      where: { 
        nombre: {
          contains: nombre,
          mode: 'insensitive'
        }, 
        estado: { equals: estado, mode: 'insensitive' }
      }
    });
    
    if (!encontrada) return [];
    
    return encontrada.map(p => new Provincias(p.id, p.nombre, p.estado, p.creadoEn));
  }

  async buscarPorEstado(estado: string): Promise<Provincias[]> {

    const provinciasOrm = await this.prisma.provincia.findMany({
      where: { 
        estado: {
          equals: estado,
          mode: 'insensitive'
        }
      },
      orderBy: { nombre: 'asc' }
    });

    if (!provinciasOrm) return [];
    
    return provinciasOrm.map(p => new Provincias(p.id, p.nombre, p.estado, p.creadoEn));
  }

  async actualizar(id: number, nombre?: string, estado?: string): Promise<Provincias> {
    // Construir objeto de actualización dinámico (solo campos proporcionados)
    const dataActualizar: any = {};
    
    if (nombre !== undefined) {
      dataActualizar.nombre = nombre;
    }
    
    if (estado !== undefined) {
      dataActualizar.estado = estado;
    }

    const actualizada = await this.prisma.provincia.update({
      where: { id: id },
      data: dataActualizar
    });

    await this.redis.del(this.CACHE_KEY); // Invalidate cache

    return new Provincias(actualizada.id, actualizada.nombre, actualizada.estado, actualizada.creadoEn);
  }

  async eliminar(id: number): Promise<Provincias> {
    // Soft Delete
    const eliminada = await this.prisma.provincia.update({
      where: { id: id },
      data: { estado: 'Eliminado' }
    });

    await this.redis.del(this.CACHE_KEY); // Invalidate cache

    return new Provincias(eliminada.id, eliminada.nombre, eliminada.estado, eliminada.creadoEn);
  }
}