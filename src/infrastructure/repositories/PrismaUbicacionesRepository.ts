import { PrismaClient } from '@prisma/client';
import { RedisCacheService } from '../external-services/RedisCacheService';
import { Ubicacion } from '../../domain/entities/Ubicacion';
import { IUbicacionesRepository } from '../../domain/repositories/IUbicacionesRepository';
import { UbicacionFueraDeRangoError } from '../../domain/errors/UbicacionFueraDeRangoError';
import { injectable, inject } from 'tsyringe';

@injectable()
export class PrismaUbicacionesRepository implements IUbicacionesRepository {
  private CACHE_KEY = 'ubicaciones:listado';
  private CACHE_KEY_POR_BARRIO = (barrioId: number) => `ubicaciones:barrio:${barrioId}`;
  private CACHE_KEY_POR_SUBBARRIO = (subBarrioId: number) =>
    `ubicaciones:subBarrio:${subBarrioId}`;
  private CACHE_TTL = 24 * 60 * 60; // 24 horas en segundos

  constructor(
    @inject('PrismaClient') private prisma: PrismaClient,
    @inject('RedisCacheService') private cache: RedisCacheService
  ) {}

  /**
   * Crea una nueva Ubicacion
   */
  async crear(
    barrioId: number,
    direccion: string,
    subBarrioId?: number,
    codigoPostal?: string,
    puntoGeografico?: string
  ): Promise<Ubicacion> {
    try {
      const ubicacion = await this.prisma.ubicacion.create({
        data: {
          barrioId,
          subBarrioId: subBarrioId || null,
          direccion: direccion.trim(),
          codigoPostal: codigoPostal ? codigoPostal.trim() : null,
          estado: 'Activo',
        },
      });

      // Si se proporcionó un punto geográfico, guardar usando raw SQL con ST_GeomFromGeoJSON
      if (puntoGeografico) {
        await this.guardarPuntoGeografico(ubicacion.id, puntoGeografico);
      }

      // Invalidar caché
      await this.invalidarCache(barrioId, subBarrioId);

      // Leer el punto geográfico si fue guardado
      const puntoGeograficoGuardado = puntoGeografico
        ? await this.leerPuntoGeografico(ubicacion.id)
        : null;

      return new Ubicacion(
        ubicacion.id,
        ubicacion.barrioId,
        ubicacion.direccion,
        ubicacion.estado,
        ubicacion.creadoEn,
        ubicacion.subBarrioId,
        ubicacion.codigoPostal,
        puntoGeograficoGuardado
      );
    } catch (error: any) {
      // Capturar errores de triggers (código P0001 de PostgreSQL)
      // Cuando el trigger validar_zona_operativa se dispara
      if (error.message && error.message.includes('P0001')) {
        throw new UbicacionFueraDeRangoError();
      }
      // Re-lanzar otros errores
      throw error;
    }
  }

  /**
   * Lista todas las Ubicaciones
   */
  async listarTodas(): Promise<Ubicacion[]> {
    // Intentar obtener del caché
    const cached = await this.cache.get(this.CACHE_KEY);
    if (cached) {
      const ubicacionesData = JSON.parse(cached);
      const ids = ubicacionesData.map((u: any) => u.id);
      const puntos = await this.leerPuntosGeograficosMultiples(ids);

      return ubicacionesData.map(
        (u: any) =>
          new Ubicacion(
            u.id,
            u.barrioId,
            u.direccion,
            u.estado,
            new Date(u.creadoEn),
            u.subBarrioId,
            u.codigoPostal,
            puntos.get(u.id) || null
          )
      );
    }

    // Si no está en caché, obtener de la BD
    const ubicaciones = await this.prisma.ubicacion.findMany({
      where: { estado: { not: 'Eliminado' } },
      orderBy: { id: 'asc' },
    });

    // Guardar en caché
    await this.cache.set(
      this.CACHE_KEY,
      JSON.stringify(ubicaciones),
      this.CACHE_TTL
    );

    // Leer puntos geográficos en una sola query
    const ids = ubicaciones.map(u => u.id);
    const puntos = await this.leerPuntosGeograficosMultiples(ids);

    return ubicaciones.map(
      u =>
        new Ubicacion(
          u.id,
          u.barrioId,
          u.direccion,
          u.estado,
          u.creadoEn,
          u.subBarrioId,
          u.codigoPostal,
          puntos.get(u.id) || null
        )
    );
  }

  /**
   * Lista todas las Ubicaciones de un barrio específico
   */
  async listarPorBarrio(barrioId: number): Promise<Ubicacion[]> {
    const cacheKey = this.CACHE_KEY_POR_BARRIO(barrioId);

    // Intentar obtener del caché
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      const ubicacionesData = JSON.parse(cached);
      const ids = ubicacionesData.map((u: any) => u.id);
      const puntos = await this.leerPuntosGeograficosMultiples(ids);

      return ubicacionesData.map(
        (u: any) =>
          new Ubicacion(
            u.id,
            u.barrioId,
            u.direccion,
            u.estado,
            new Date(u.creadoEn),
            u.subBarrioId,
            u.codigoPostal,
            puntos.get(u.id) || null
          )
      );
    }

    // Si no está en caché, obtener de la BD
    const ubicaciones = await this.prisma.ubicacion.findMany({
      where: {
        barrioId,
        estado: { not: 'Eliminado' },
      },
      orderBy: { id: 'asc' },
    });

    // Guardar en caché
    await this.cache.set(cacheKey, JSON.stringify(ubicaciones), this.CACHE_TTL);

    // Leer puntos geográficos en una sola query
    const ids = ubicaciones.map(u => u.id);
    const puntos = await this.leerPuntosGeograficosMultiples(ids);

    return ubicaciones.map(
      u =>
        new Ubicacion(
          u.id,
          u.barrioId,
          u.direccion,
          u.estado,
          u.creadoEn,
          u.subBarrioId,
          u.codigoPostal,
          puntos.get(u.id) || null
        )
    );
  }

  /**
   * Lista todas las Ubicaciones de un SubBarrio específico
   */
  async listarPorSubBarrio(subBarrioId: number): Promise<Ubicacion[]> {
    const cacheKey = this.CACHE_KEY_POR_SUBBARRIO(subBarrioId);

    // Intentar obtener del caché
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      const ubicacionesData = JSON.parse(cached);
      const ids = ubicacionesData.map((u: any) => u.id);
      const puntos = await this.leerPuntosGeograficosMultiples(ids);

      return ubicacionesData.map(
        (u: any) =>
          new Ubicacion(
            u.id,
            u.barrioId,
            u.direccion,
            u.estado,
            new Date(u.creadoEn),
            u.subBarrioId,
            u.codigoPostal,
            puntos.get(u.id) || null
          )
      );
    }

    // Si no está en caché, obtener de la BD
    const ubicaciones = await this.prisma.ubicacion.findMany({
      where: {
        subBarrioId,
        estado: { not: 'Eliminado' },
      },
      orderBy: { id: 'asc' },
    });

    // Guardar en caché
    await this.cache.set(cacheKey, JSON.stringify(ubicaciones), this.CACHE_TTL);

    // Leer puntos geográficos en una sola query
    const ids = ubicaciones.map(u => u.id);
    const puntos = await this.leerPuntosGeograficosMultiples(ids);

    return ubicaciones.map(
      u =>
        new Ubicacion(
          u.id,
          u.barrioId,
          u.direccion,
          u.estado,
          u.creadoEn,
          u.subBarrioId,
          u.codigoPostal,
          puntos.get(u.id) || null
        )
    );
  }

  /**
   * Busca una Ubicacion por ID
   */
  async buscarPorId(id: number): Promise<Ubicacion | null> {
    const ubicacion = await this.prisma.ubicacion.findUnique({
      where: { id },
    });

    if (!ubicacion || ubicacion.estado === 'Eliminado') {
      return null;
    }

    // Leer el punto geográfico si existe
    const puntoGeografico = await this.leerPuntoGeografico(id);

    return new Ubicacion(
      ubicacion.id,
      ubicacion.barrioId,
      ubicacion.direccion,
      ubicacion.estado,
      ubicacion.creadoEn,
      ubicacion.subBarrioId,
      ubicacion.codigoPostal,
      puntoGeografico
    );
  }

  /**
   * Busca Ubicaciones por dirección
   */
  async buscarPorDireccion(direccion: string): Promise<Ubicacion[]> {
    const ubicaciones = await this.prisma.ubicacion.findMany({
      where: {
        direccion: { contains: direccion, mode: 'insensitive' },
        estado: { not: 'Eliminado' },
      },
    });

    // Leer puntos geográficos en una sola query
    const ids = ubicaciones.map(u => u.id);
    const puntos = await this.leerPuntosGeograficosMultiples(ids);

    return ubicaciones.map(
      u =>
        new Ubicacion(
          u.id,
          u.barrioId,
          u.direccion,
          u.estado,
          u.creadoEn,
          u.subBarrioId,
          u.codigoPostal,
          puntos.get(u.id) || null
        )
    );
  }

  /**
   * Busca Ubicaciones por código postal
   */
  async buscarPorCodigoPostal(codigoPostal: string): Promise<Ubicacion[]> {
    const ubicaciones = await this.prisma.ubicacion.findMany({
      where: {
        codigoPostal,
        estado: { not: 'Eliminado' },
      },
    });

    // Leer puntos geográficos en una sola query
    const ids = ubicaciones.map(u => u.id);
    const puntos = await this.leerPuntosGeograficosMultiples(ids);

    return ubicaciones.map(
      u =>
        new Ubicacion(
          u.id,
          u.barrioId,
          u.direccion,
          u.estado,
          u.creadoEn,
          u.subBarrioId,
          u.codigoPostal,
          puntos.get(u.id) || null
        )
    );
  }

  /**
   * Busca Ubicaciones por estado
   */
  async buscarPorEstado(estado: string): Promise<Ubicacion[]> {
    const ubicaciones = await this.prisma.ubicacion.findMany({
      where: {
        estado,
      },
    });

    // Leer puntos geográficos en una sola query
    const ids = ubicaciones.map(u => u.id);
    const puntos = await this.leerPuntosGeograficosMultiples(ids);

    return ubicaciones.map(
      u =>
        new Ubicacion(
          u.id,
          u.barrioId,
          u.direccion,
          u.estado,
          u.creadoEn,
          u.subBarrioId,
          u.codigoPostal,
          puntos.get(u.id) || null
        )
    );
  }

  /**
   * Actualiza una Ubicacion existente
   */
  async actualizar(
    id: number,
    barrioId?: number,
    subBarrioId?: number,
    direccion?: string,
    codigoPostal?: string,
    estado?: string,
    puntoGeografico?: string
  ): Promise<Ubicacion> {
    try {
      const ubicacionExistente = await this.prisma.ubicacion.findUnique({
        where: { id },
      });
      if (!ubicacionExistente) {
        throw new Error(`Ubicacion con ID ${id} no existe`);
      }

      const datosActualizacion: any = {};
      if (direccion !== undefined) datosActualizacion.direccion = direccion.trim();
      if (codigoPostal !== undefined)
        datosActualizacion.codigoPostal = codigoPostal ? codigoPostal.trim() : null;
      if (barrioId !== undefined) datosActualizacion.barrioId = barrioId;
      if (subBarrioId !== undefined)
        datosActualizacion.subBarrioId = subBarrioId || null;
      if (estado !== undefined) datosActualizacion.estado = estado;

      const ubicacionActualizada = await this.prisma.ubicacion.update({
        where: { id },
        data: datosActualizacion,
      });

      // Si se proporcionó un punto geográfico, guardar usando raw SQL con ST_GeomFromGeoJSON
      if (puntoGeografico) {
        await this.guardarPuntoGeografico(id, puntoGeografico);
      }

      // Invalidar caché del barrio anterior y nuevo
      const barrioAnterior = ubicacionExistente.barrioId;
      const subBarrioAnterior = ubicacionExistente.subBarrioId || undefined;
      const barrioNuevo = barrioId || ubicacionExistente.barrioId;
      const subBarrioNuevo = subBarrioId !== undefined ? subBarrioId : ubicacionExistente.subBarrioId;

      await this.invalidarCache(barrioAnterior, subBarrioAnterior);
      if (barrioNuevo !== barrioAnterior || subBarrioNuevo !== (subBarrioAnterior || undefined)) {
        await this.invalidarCache(barrioNuevo, subBarrioNuevo || undefined);
      }

      // Leer el punto geográfico si fue actualizado
      const puntoGeograficoGuardado = puntoGeografico
        ? await this.leerPuntoGeografico(id)
        : null;

      return new Ubicacion(
        ubicacionActualizada.id,
        ubicacionActualizada.barrioId,
        ubicacionActualizada.direccion,
        ubicacionActualizada.estado,
        ubicacionActualizada.creadoEn,
        ubicacionActualizada.subBarrioId,
        ubicacionActualizada.codigoPostal,
        puntoGeograficoGuardado
      );
    } catch (error: any) {
      // Capturar errores de triggers (código P0001 de PostgreSQL)
      // Cuando el trigger validar_zona_operativa se dispara
      if (error.message && error.message.includes('P0001')) {
        throw new UbicacionFueraDeRangoError();
      }
      // Re-lanzar otros errores
      throw error;
    }
  }

  /**
   * Elimina una Ubicacion (eliminación lógica)
   */
  async eliminar(id: number): Promise<Ubicacion> {
    const ubicacion = await this.prisma.ubicacion.findUnique({ where: { id } });
    if (!ubicacion) {
      throw new Error(`Ubicacion con ID ${id} no existe`);
    }

    // Verificar que no haya centros de salud, horarios, citas o pacientes asociados
    const centrosSalud = await this.prisma.centroSalud.count({
      where: { ubicacionId: id },
    });

    if (centrosSalud > 0) {
      throw new Error(
        `No se puede eliminar la ubicación porque tiene ${centrosSalud} centro(s) de salud asociado(s)`
      );
    }

    const horarios = await this.prisma.horario.count({
      where: { ubicacionId: id },
    });

    if (horarios > 0) {
      throw new Error(
        `No se puede eliminar la ubicación porque tiene ${horarios} horario(s) asociado(s)`
      );
    }

    const citas = await this.prisma.cita.count({
      where: { ubicacionId: id },
    });

    if (citas > 0) {
      throw new Error(
        `No se puede eliminar la ubicación porque tiene ${citas} cita(s) asociada(s)`
      );
    }

    const pacientes = await this.prisma.paciente.count({
      where: { ubicacionId: id },
    });

    if (pacientes > 0) {
      throw new Error(
        `No se puede eliminar la ubicación porque hay ${pacientes} paciente(s) asociado(s)`
      );
    }

    // Eliminación lógica
    const ubicacionEliminada = await this.prisma.ubicacion.update({
      where: { id },
      data: { estado: 'Eliminado' },
    });

    // Invalidar caché
    await this.invalidarCache(ubicacion.barrioId, ubicacion.subBarrioId || undefined);

    return new Ubicacion(
      ubicacionEliminada.id,
      ubicacionEliminada.barrioId,
      ubicacionEliminada.direccion,
      ubicacionEliminada.estado,
      ubicacionEliminada.creadoEn,
      ubicacionEliminada.subBarrioId,
      ubicacionEliminada.codigoPostal,
      null
    );
  }

  /**
   * Invalida todas las claves de caché relacionadas con Ubicaciones
   */
  private async invalidarCache(barrioId: number, subBarrioId?: number): Promise<void> {
    const keys = [this.CACHE_KEY, this.CACHE_KEY_POR_BARRIO(barrioId)];
    if (subBarrioId) {
      keys.push(this.CACHE_KEY_POR_SUBBARRIO(subBarrioId));
    }
    await Promise.all(keys.map(key => this.cache.del(key)));
  }

  /**
   * Lee el punto geográfico de una ubicación desde la base de datos
   * Usa ST_AsGeoJSON para convertir la geometría PostGIS a formato GeoJSON
   * @param id - ID de la ubicación
   * @returns Punto geográfico en formato GeoJSON o null si no existe
   */
  private async leerPuntoGeografico(id: number): Promise<string | null> {
    try {
      const resultado = await this.prisma.$queryRaw<
        Array<{ punto_geografico: string }>
      >`
        SELECT ST_AsGeoJSON("punto_geografico") as punto_geografico
        FROM "ubicaciones"
        WHERE "id_ubicacion" = ${id}
      `;
      
      if (resultado && resultado.length > 0 && resultado[0].punto_geografico) {
        return resultado[0].punto_geografico;
      }
      return null;
    } catch (error) {
      console.error(
        `Error al leer el punto geográfico de ubicación ${id}:`,
        error
      );
      return null;
    }
  }

  /**
   * Lee los puntos geográficos de múltiples ubicaciones en una sola query
   * Optimizado para evitar N+1 queries al recuperar listas
   * @param ids - Array de IDs de ubicaciones
   * @returns Mapa de id -> puntoGeografico GeoJSON
   */
  private async leerPuntosGeograficosMultiples(
    ids: number[]
  ): Promise<Map<number, string | null>> {
    const resultado = new Map<number, string | null>();

    if (ids.length === 0) {
      return resultado;
    }

    try {
      const puntos = await this.prisma.$queryRaw<
        Array<{ id_ubicacion: number; punto_geografico: string }>
      >`
        SELECT "id_ubicacion", ST_AsGeoJSON("punto_geografico") as punto_geografico
        FROM "ubicaciones"
        WHERE "id_ubicacion" = ANY(${ids}::integer[])
      `;

      // Inicializar todos los IDs con null
      ids.forEach(id => resultado.set(id, null));

      // Actualizar con los puntos encontrados
      puntos.forEach(p => {
        if (p.punto_geografico) {
          resultado.set(p.id_ubicacion, p.punto_geografico);
        }
      });

      return resultado;
    } catch (error) {
      console.error(
        `Error al leer puntos geográficos para ubicaciones ${ids.join(', ')}:`,
        error
      );
      // Retornar mapa con todos en null en caso de error
      const fallback = new Map<number, string | null>();
      ids.forEach(id => fallback.set(id, null));
      return fallback;
    }
  }

  /**
   * Guarda un punto geográfico en formato GeoJSON para una ubicación
   * Usa ST_GeomFromGeoJSON para convertir GeoJSON a geometría PostGIS
   * Con validación de SQL injection mediante parametrización
   * @param id - ID de la ubicación
   * @param puntoGeografico - Punto en formato GeoJSON
   */
  private async guardarPuntoGeografico(
    id: number,
    puntoGeografico: string
  ): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        UPDATE "ubicaciones" 
        SET "punto_geografico" = ST_SetSRID(ST_GeomFromGeoJSON(${puntoGeografico}::jsonb), 4326)
        WHERE "id_ubicacion" = ${id}
      `;
    } catch (error) {
      console.error(
        `Error al guardar el punto geográfico para ubicación ${id}:`,
        error
      );
      throw error;
    }
  }
}