import { PrismaClient } from '@prisma/client';
import { injectable } from 'tsyringe';
import { IProfesionesRepository } from '../../domain/repositories/IProfesionesRepository';
import { Profesion } from '../../domain/entities/Profesion';
import { RedisCacheService } from '../external-services/RedisCacheService';

@injectable()
export class PrismaProfesionesRepository implements IProfesionesRepository {
  private readonly CACHE_KEY_LIST = 'profesiones:listado';
  private readonly CACHE_KEY_PREFIX = 'profesiones:';

  constructor(
    private prisma: PrismaClient,
    private redis: RedisCacheService
  ) {}

  async crear(nombre: string, estado: string): Promise<Profesion> {
    const nuevaProfesion = await this.prisma.profesion.create({
      data: {
        nombre,
        estado,
      },
    });

    // Invalidar cache de listado
    await this.redis.del(this.CACHE_KEY_LIST);

    return this.mapearEntidad(nuevaProfesion);
  }

  async obtenerPorId(id: number): Promise<Profesion | null> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${id}`;
    
    // Verificar cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const encontrada = await this.prisma.profesion.findUnique({
      where: { id },
    });

    if (!encontrada) {
      return null;
    }

    const entidad = this.mapearEntidad(encontrada);

    // Guardar en cache por 1 hora
    await this.redis.set(cacheKey, JSON.stringify(entidad), 3600);

    return entidad;
  }

  async obtenerTodos(
    estado?: string,
    busqueda?: string,
    pagina: number = 1,
    limite: number = 10
  ): Promise<{ profesiones: Profesion[]; total: number }> {
    // Solo cachear consultas por defecto (sin filtros, página 1, límite 10)
    const esConsultaPorDefecto = !estado && !busqueda && pagina === 1 && limite === 10;
    
    if (esConsultaPorDefecto) {
      const cached = await this.redis.get(this.CACHE_KEY_LIST);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const where: any = {};

    if (estado) {
      where.estado = estado;
    }

    if (busqueda) {
      where.nombre = {
        contains: busqueda,
        mode: 'insensitive',
      };
    }

    const [profesiones, total] = await Promise.all([
      this.prisma.profesion.findMany({
        where,
        skip: (pagina - 1) * limite,
        take: limite,
        orderBy: { creadoEn: 'desc' },
      }),
      this.prisma.profesion.count({ where }),
    ]);

    const resultado = {
      profesiones: profesiones.map(this.mapearEntidad),
      total,
    };

    // Guardar en cache solo si es consulta por defecto
    if (esConsultaPorDefecto) {
      await this.redis.set(this.CACHE_KEY_LIST, JSON.stringify(resultado), 3600);
    }

    return resultado;
  }

  async actualizar(id: number, nombre?: string, estado?: string): Promise<Profesion> {
    const data: any = {};

    if (nombre !== undefined) {
      data.nombre = nombre;
    }

    if (estado !== undefined) {
      data.estado = estado;
    }

    const actualizada = await this.prisma.profesion.update({
      where: { id },
      data,
    });

    // Invalidar cache
    await this.redis.del(`${this.CACHE_KEY_PREFIX}${id}`);
    await this.redis.del(this.CACHE_KEY_LIST);

    return this.mapearEntidad(actualizada);
  }

  async eliminar(id: number): Promise<void> {
    // Soft delete
    await this.prisma.profesion.update({
      where: { id },
      data: { estado: 'Eliminado' },
    });

    // Invalidar cache
    await this.redis.del(`${this.CACHE_KEY_PREFIX}${id}`);
    await this.redis.del(this.CACHE_KEY_LIST);
  }

  async existePorNombre(nombre: string, excluyendoId?: number): Promise<boolean> {
    const where: any = {
      nombre: {
        equals: nombre,
        mode: 'insensitive',
      },
      estado: {
        not: 'Eliminado',
      },
    };

    if (excluyendoId) {
      where.id = { not: excluyendoId };
    }

    const count = await this.prisma.profesion.count({ where });
    return count > 0;
  }

  private mapearEntidad(profesion: any): Profesion {
    return new Profesion(
      profesion.id,
      profesion.nombre,
      profesion.estado,
      profesion.creadoEn
    );
  }
}
