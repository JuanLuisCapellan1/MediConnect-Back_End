import { PrismaClient } from '@prisma/client';
import { RedisCacheService } from '../external-services/RedisCacheService';
import { Seccion } from '../../domain/entities/Seccion';
import { ISeccionesRepository } from '../../domain/repositories/ISeccionesRepository';
import { ActualizarSeccionDto } from '../../application/dtos/SeccionDtos';

export class PrismaSeccionesRepository implements ISeccionesRepository {
  private prisma: PrismaClient;
  private redis: RedisCacheService;
  private readonly CACHE_KEY = 'secciones:listado';
  private readonly CACHE_TTL = 86400; // 24 horas
  private readonly CACHE_KEY_POR_DISTRITO = (distritoMunicipalId: number) => `secciones:distrito:${distritoMunicipalId}`;

  constructor(prisma: PrismaClient, redis: RedisCacheService) {
    this.prisma = prisma;
    this.redis = redis;
  }

  async obtenerTodas(estado?: string): Promise<Seccion[]> {
    const cacheKey = estado ? `${this.CACHE_KEY}:${estado}` : this.CACHE_KEY;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const secciones = await this.prisma.seccion.findMany({
      where: estado ? { estado } : undefined,
      orderBy: { nombre: 'asc' }
    });

    const mapped = secciones.map(
      (s) =>
        new Seccion(
          s.id,
          s.distritoMunicipalId,
          s.nombre,
          s.estado,
          s.creadoEn
        )
    );

    await this.redis.set(cacheKey, JSON.stringify(mapped), this.CACHE_TTL);
    return mapped;
  }

  async obtenerPorId(id: number): Promise<Seccion | null> {
    const seccion = await this.prisma.seccion.findUnique({
      where: { id }
    });

    if (!seccion) {
      return null;
    }

    return new Seccion(
      seccion.id,
      seccion.distritoMunicipalId,
      seccion.nombre,
      seccion.estado,
      seccion.creadoEn
    );
  }

  async obtenerPorDistrito(distritoMunicipalId: number, estado?: string): Promise<Seccion[]> {
    const cacheKey = estado
      ? `${this.CACHE_KEY_POR_DISTRITO(distritoMunicipalId)}:${estado}`
      : this.CACHE_KEY_POR_DISTRITO(distritoMunicipalId);

    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const secciones = await this.prisma.seccion.findMany({
      where: {
        distritoMunicipalId,
        ...(estado && { estado })
      },
      orderBy: { nombre: 'asc' }
    });

    const mapped = secciones.map(
      (s) =>
        new Seccion(
          s.id,
          s.distritoMunicipalId,
          s.nombre,
          s.estado,
          s.creadoEn
        )
    );

    await this.redis.set(cacheKey, JSON.stringify(mapped), this.CACHE_TTL);
    return mapped;
  }

  async obtenerPorMunicipio(municipioId: number, estado?: string): Promise<Seccion[]> {
    const cacheKey = estado
      ? `secciones:municipio:${municipioId}:${estado}`
      : `secciones:municipio:${municipioId}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // Usa raw query para cubrir ambas rutas:
    //  1. Secciones cuyo distrito → municipio coincide
    //  2. Secciones con id_municipio directo (sin distrito asignado)
    type RawSeccion = {
      id_seccion: number;
      id_distrito_municipal: number | null;
      nombre: string;
      estado: string;
      creado_en: Date;
    };

    const estadoFilter = estado ? `AND s.estado = '${estado}'` : '';

    const secciones = await this.prisma.$queryRawUnsafe<RawSeccion[]>(`
      SELECT DISTINCT
        s.id_seccion,
        s.id_distrito_municipal,
        s.nombre,
        s.estado,
        s.creado_en
      FROM secciones s
      LEFT JOIN distritos_municipales dm
        ON dm.id_distrito_municipal = s.id_distrito_municipal
      WHERE
        (dm.id_municipio = $1 OR s.id_municipio = $1)
        ${estadoFilter}
      ORDER BY s.nombre ASC
    `, municipioId);

    const mapped = secciones.map(
      (s) =>
        new Seccion(
          s.id_seccion,
          s.id_distrito_municipal,
          s.nombre,
          s.estado,
          s.creado_en
        )
    );

    await this.redis.set(cacheKey, JSON.stringify(mapped), this.CACHE_TTL);
    return mapped;
  }


  async buscarPorNombre(nombre: string, distritoMunicipalId?: number, estado?: string): Promise<Seccion[]> {
    const seccion = await this.prisma.seccion.findMany({
      where: {
        nombre: {
          contains: nombre,
          mode: 'insensitive'
        },
        ...(distritoMunicipalId && { distritoMunicipalId }),
        ...(estado && { estado })
      }
    });

    if (!seccion) {
      return [];
    }

    return seccion.map(
      (s) =>
        new Seccion(
          s.id,
          s.distritoMunicipalId,
          s.nombre,
          s.estado,
          s.creadoEn
        )
    );
  }

  async buscarPorNombreSensitive(nombre: string, distritoMunicipalId?: number, estado?: string): Promise<Seccion[]> {
    const seccion = await this.prisma.seccion.findMany({
      where: {
        nombre: {
          equals: nombre
        },
        ...(distritoMunicipalId && { distritoMunicipalId }),
        ...(estado && { estado })
      }
    });

    if (!seccion) {
      return [];
    }

    return seccion.map(
      (s) =>
        new Seccion(
          s.id,
          s.distritoMunicipalId,
          s.nombre,
          s.estado,
          s.creadoEn
        )
    );
  }

  async crear(seccion: Seccion): Promise<Seccion> {
    const createData: Record<string, any> = {
      nombre: seccion.nombre,
      estado: seccion.estado
    };

    if (seccion.distritoMunicipalId !== null) {
      createData.distritoMunicipalId = seccion.distritoMunicipalId;
    }

    const nueva = await this.prisma.seccion.create({
      data: createData as any
    });

    // Invalidar cachés
    if (nueva.distritoMunicipalId) {
      await this.invalidarCaches(nueva.distritoMunicipalId);
    }

    await this.redis.del(this.CACHE_KEY);
    await this.redis.del(`${this.CACHE_KEY}:Activo`);
    await this.redis.del(`${this.CACHE_KEY}:Inactivo`);

    return new Seccion(
      nueva.id,
      nueva.distritoMunicipalId,
      nueva.nombre,
      nueva.estado,
      nueva.creadoEn
    );
  }

  async actualizar(id: number, datos: ActualizarSeccionDto): Promise<Seccion> {
    const seccionExistente = await this.prisma.seccion.findUnique({
      where: { id }
    });

    if (!seccionExistente) {
      throw new Error(`Sección con ID ${id} no encontrada`);
    }

    // Validar que el nuevo distrito sea válido si se proporciona
    if (datos.distritoMunicipalId !== undefined && datos.distritoMunicipalId !== seccionExistente.distritoMunicipalId) {
      const distritoExistente = await this.prisma.distritoMunicipal.findUnique({
        where: { id: datos.distritoMunicipalId }
      });

      if (!distritoExistente) {
        throw new Error(`Distrito Municipal con ID ${datos.distritoMunicipalId} no encontrado`);
      }

      if (distritoExistente.estado !== 'Activo') {
        throw new Error(`El distrito municipal con ID ${datos.distritoMunicipalId} no se encuentra en estado Activo`);
      }
    }

    const distritoPrevioId = seccionExistente.distritoMunicipalId;

    const updateData: Record<string, any> = {};

    if (datos.distritoMunicipalId !== undefined) {
      updateData.distritoMunicipalId = datos.distritoMunicipalId;
    }

    if (datos.nombre !== undefined) {
      updateData.nombre = datos.nombre;
    }

    if (datos.estado !== undefined) {
      updateData.estado = datos.estado;
    }

    const actualizada = await this.prisma.seccion.update({
      where: { id },
      data: updateData
    });

    // Invalidar cachés
    await this.redis.del(this.CACHE_KEY);
    await this.redis.del(`${this.CACHE_KEY}:Activo`);
    await this.redis.del(`${this.CACHE_KEY}:Inactivo`);

    if (distritoPrevioId) {
      await this.invalidarCaches(distritoPrevioId);
    }
    if (actualizada.distritoMunicipalId) {
      await this.invalidarCaches(actualizada.distritoMunicipalId);
    }

    return new Seccion(
      actualizada.id,
      actualizada.distritoMunicipalId,
      actualizada.nombre,
      actualizada.estado,
      actualizada.creadoEn
    );
  }

  async eliminar(id: number): Promise<Seccion> {
    const seccion = await this.prisma.seccion.findUnique({
      where: { id }
    });

    if (!seccion) {
      throw new Error(`Sección con ID ${id} no encontrada`);
    }

    const eliminada = await this.prisma.seccion.update({
      where: { id },
      data: { estado: 'Eliminado' }
    });

    // Invalidar cachés
    await this.redis.del(this.CACHE_KEY);
    await this.redis.del(`${this.CACHE_KEY}:Activo`);
    await this.redis.del(`${this.CACHE_KEY}:Inactivo`);

    if (seccion.distritoMunicipalId) {
      await this.invalidarCaches(seccion.distritoMunicipalId);
    }


    return new Seccion(
      eliminada.id,
      eliminada.distritoMunicipalId,
      eliminada.nombre,
      eliminada.estado,
      eliminada.creadoEn
    );
  }

  private async invalidarCaches(distritoMunicipalId: number): Promise<void> {
    await Promise.all([
      this.redis.del(this.CACHE_KEY_POR_DISTRITO(distritoMunicipalId)),
      this.redis.del(`${this.CACHE_KEY_POR_DISTRITO(distritoMunicipalId)}:Activo`),
      this.redis.del(`${this.CACHE_KEY_POR_DISTRITO(distritoMunicipalId)}:Inactivo}`)
    ]);
  }
}
