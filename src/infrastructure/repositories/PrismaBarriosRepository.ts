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

    // Validar que no tenga ubicaciones asociadas
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

  /**
   * Busca el barrio cuyo polígono geom contiene el punto (longitud, latitud)
   * e incluye toda la cadena geográfica: sección, distrito municipal, municipio y provincia.
   *
   * NOTA IMPORTANTE SOBRE EL SRID:
   * Los datos de `geom` están en coordenadas métricas UTM Zona 19N (EPSG:32619)
   * pero el SRID declarado en la columna es 4326 (incorrecto).
   * Solución: ST_SetSRID(geom, 32619) + ST_Transform del punto de entrada.
   */
  async buscarPorCoordenadas(longitud: number, latitud: number): Promise<Barrio | null> {
    type RawBarrioCompleto = {
      id_barrio: number;
      id_seccion: number;
      barrio_nombre: string;
      barrio_estado: string;
      creado_en: Date;
      geom_json: string | null;
      // Sección
      seccion_id: number;
      seccion_nombre: string;
      seccion_estado: string;
      // Distrito Municipal
      dm_id: number | null;
      dm_nombre: string | null;
      dm_estado: string | null;
      // Municipio
      municipio_id: number | null;
      municipio_nombre: string | null;
      municipio_estado: string | null;
      // Provincia
      provincia_id: number | null;
      provincia_nombre: string | null;
      provincia_estado: string | null;
    };

    const resultados = await this.prisma.$queryRaw<RawBarrioCompleto[]>`
      SELECT
        b.id_barrio,
        b.id_seccion,
        b.nombre            AS barrio_nombre,
        b.estado            AS barrio_estado,
        b.creado_en,
        ST_AsGeoJSON(
          ST_Transform(ST_SetSRID(b.geom, 32619), 4326)
        )::text             AS geom_json,
        s.id_seccion        AS seccion_id,
        s.nombre            AS seccion_nombre,
        s.estado            AS seccion_estado,
        dm.id_distrito_municipal AS dm_id,
        dm.nombre           AS dm_nombre,
        dm.estado           AS dm_estado,
        m.id_municipio      AS municipio_id,
        m.nombre            AS municipio_nombre,
        m.estado            AS municipio_estado,
        p.id_provincia      AS provincia_id,
        p.nombre            AS provincia_nombre,
        p.estado            AS provincia_estado
      FROM barrios b
      INNER JOIN secciones s
        ON s.id_seccion = b.id_seccion
      LEFT JOIN distritos_municipales dm
        ON dm.id_distrito_municipal = s.id_distrito_municipal
      LEFT JOIN municipios m
        ON m.id_municipio = COALESCE(dm.id_municipio, s.id_municipio)
      LEFT JOIN provincias p
        ON p.id_provincia = m.id_provincia
      WHERE
        b.geom IS NOT NULL
        AND b.estado NOT IN ('Eliminado', 'Inactivo')
        AND ST_Contains(
          ST_SetSRID(b.geom, 32619),
          ST_Transform(
            ST_SetSRID(ST_MakePoint(${longitud}, ${latitud}), 4326),
            32619
          )
        )
      LIMIT 1
    `;

    if (!resultados || resultados.length === 0) return null;

    const raw = resultados[0];
    return new Barrio(
      raw.id_barrio,
      raw.id_seccion,
      raw.barrio_nombre,
      raw.barrio_estado,
      raw.creado_en,
      raw.geom_json ? JSON.parse(raw.geom_json) : null,
      { id: raw.seccion_id, nombre: raw.seccion_nombre, estado: raw.seccion_estado },
      raw.dm_id ? { id: raw.dm_id, nombre: raw.dm_nombre!, estado: raw.dm_estado! } : null,
      raw.municipio_id ? { id: raw.municipio_id, nombre: raw.municipio_nombre!, estado: raw.municipio_estado! } : null,
      raw.provincia_id ? { id: raw.provincia_id, nombre: raw.provincia_nombre!, estado: raw.provincia_estado! } : null
    );
  }

  /**
   * Obtiene un barrio con su geometría completa en GeoJSON (WGS84) e incluye
   * toda la cadena geográfica: sección, distrito municipal, municipio y provincia.
   *
   * NOTA: Los datos de geom están en UTM 32619 (metros) con SRID incorrecto declarado como 4326.
   * Se corrige con ST_SetSRID(geom, 32619) + ST_Transform(..., 4326) antes de ST_AsGeoJSON.
   */
  async obtenerGeometria(id: number): Promise<Barrio | null> {
    type RawBarrioGeoCompleto = {
      id_barrio: number;
      id_seccion: number;
      barrio_nombre: string;
      barrio_estado: string;
      creado_en: Date;
      geom_json: string | null;
      // Sección
      seccion_id: number;
      seccion_nombre: string;
      seccion_estado: string;
      // Distrito Municipal
      dm_id: number | null;
      dm_nombre: string | null;
      dm_estado: string | null;
      // Municipio
      municipio_id: number | null;
      municipio_nombre: string | null;
      municipio_estado: string | null;
      // Provincia
      provincia_id: number | null;
      provincia_nombre: string | null;
      provincia_estado: string | null;
    };

    const resultados = await this.prisma.$queryRaw<RawBarrioGeoCompleto[]>`
      SELECT
        b.id_barrio,
        b.id_seccion,
        b.nombre             AS barrio_nombre,
        b.estado             AS barrio_estado,
        b.creado_en,
        ST_AsGeoJSON(
          ST_Transform(ST_SetSRID(b.geom, 32619), 4326)
        )::text              AS geom_json,
        s.id_seccion         AS seccion_id,
        s.nombre             AS seccion_nombre,
        s.estado             AS seccion_estado,
        dm.id_distrito_municipal AS dm_id,
        dm.nombre            AS dm_nombre,
        dm.estado            AS dm_estado,
        m.id_municipio       AS municipio_id,
        m.nombre             AS municipio_nombre,
        m.estado             AS municipio_estado,
        p.id_provincia       AS provincia_id,
        p.nombre             AS provincia_nombre,
        p.estado             AS provincia_estado
      FROM barrios b
      INNER JOIN secciones s
        ON s.id_seccion = b.id_seccion
      LEFT JOIN distritos_municipales dm
        ON dm.id_distrito_municipal = s.id_distrito_municipal
      LEFT JOIN municipios m
        ON m.id_municipio = COALESCE(dm.id_municipio, s.id_municipio)
      LEFT JOIN provincias p
        ON p.id_provincia = m.id_provincia
      WHERE b.id_barrio = ${id}
      LIMIT 1
    `;

    if (!resultados || resultados.length === 0) return null;

    const raw = resultados[0];
    const geomParsed = raw.geom_json ? JSON.parse(raw.geom_json) : null;

    return new Barrio(
      raw.id_barrio,
      raw.id_seccion,
      raw.barrio_nombre,
      raw.barrio_estado,
      raw.creado_en,
      geomParsed,
      { id: raw.seccion_id, nombre: raw.seccion_nombre, estado: raw.seccion_estado },
      raw.dm_id ? { id: raw.dm_id, nombre: raw.dm_nombre!, estado: raw.dm_estado! } : null,
      raw.municipio_id ? { id: raw.municipio_id, nombre: raw.municipio_nombre!, estado: raw.municipio_estado! } : null,
      raw.provincia_id ? { id: raw.provincia_id, nombre: raw.provincia_nombre!, estado: raw.provincia_estado! } : null
    );
  }
}
