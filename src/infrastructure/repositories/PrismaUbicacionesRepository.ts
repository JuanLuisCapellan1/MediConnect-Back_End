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
  private CACHE_TTL = 24 * 60 * 60; // 24 horas

  constructor(
    @inject('PrismaClient') private prisma: PrismaClient,
    @inject('RedisCacheService') private cache: RedisCacheService
  ) { }

  private toEntity(u: any, puntoGeografico: string | null = null): Ubicacion {
    return new Ubicacion(
      u.id,
      u.barrioId,
      u.direccion,
      u.estado,
      u.creadoEn ?? new Date(u.creado_en ?? u.creadoEn),
      u.codigoPostal ?? null,
      puntoGeografico
    );
  }

  async crear(
    barrioId: number,
    direccion: string,
    codigoPostal?: string,
    puntoGeografico?: string
  ): Promise<Ubicacion> {
    try {
      const ubicacion = await this.prisma.ubicacion.create({
        data: {
          barrioId,
          direccion: direccion.trim(),
          codigoPostal: codigoPostal ? codigoPostal.trim() : null,
          estado: 'Activo',
        },
      });

      if (puntoGeografico) {
        await this.guardarPuntoGeografico(ubicacion.id, puntoGeografico);
      }

      await this.invalidarCache(barrioId);

      const puntoGuardado = puntoGeografico
        ? await this.leerPuntoGeografico(ubicacion.id)
        : null;

      return this.toEntity(ubicacion, puntoGuardado);
    } catch (error: any) {
      if (error.message?.includes('P0001')) throw new UbicacionFueraDeRangoError();
      throw error;
    }
  }

  async listarTodas(): Promise<Ubicacion[]> {
    const cached = await this.cache.get(this.CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      const ids = data.map((u: any) => u.id);
      const puntos = await this.leerPuntosGeograficosMultiples(ids);
      return data.map((u: any) => this.toEntity(u, puntos.get(u.id) ?? null));
    }

    const ubicaciones = await this.prisma.ubicacion.findMany({
      where: { estado: { not: 'Eliminado' } },
      orderBy: { id: 'asc' },
    });

    await this.cache.set(this.CACHE_KEY, JSON.stringify(ubicaciones), this.CACHE_TTL);
    const ids = ubicaciones.map(u => u.id);
    const puntos = await this.leerPuntosGeograficosMultiples(ids);
    return ubicaciones.map(u => this.toEntity(u, puntos.get(u.id) ?? null));
  }

  async listarPorBarrio(barrioId: number): Promise<Ubicacion[]> {
    const cacheKey = this.CACHE_KEY_POR_BARRIO(barrioId);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      const ids = data.map((u: any) => u.id);
      const puntos = await this.leerPuntosGeograficosMultiples(ids);
      return data.map((u: any) => this.toEntity(u, puntos.get(u.id) ?? null));
    }

    const ubicaciones = await this.prisma.ubicacion.findMany({
      where: { barrioId, estado: { not: 'Eliminado' } },
      orderBy: { id: 'asc' },
    });

    await this.cache.set(cacheKey, JSON.stringify(ubicaciones), this.CACHE_TTL);
    const ids = ubicaciones.map(u => u.id);
    const puntos = await this.leerPuntosGeograficosMultiples(ids);
    return ubicaciones.map(u => this.toEntity(u, puntos.get(u.id) ?? null));
  }

  async buscarPorId(id: number): Promise<Ubicacion | null> {
    const ubicacion = await this.prisma.ubicacion.findUnique({ where: { id } });
    if (!ubicacion || ubicacion.estado === 'Eliminado') return null;
    const puntoGeografico = await this.leerPuntoGeografico(id);
    return this.toEntity(ubicacion, puntoGeografico);
  }

  async buscarPorDireccion(direccion: string): Promise<Ubicacion[]> {
    const ubicaciones = await this.prisma.ubicacion.findMany({
      where: { direccion: { contains: direccion, mode: 'insensitive' }, estado: { not: 'Eliminado' } },
    });
    const ids = ubicaciones.map(u => u.id);
    const puntos = await this.leerPuntosGeograficosMultiples(ids);
    return ubicaciones.map(u => this.toEntity(u, puntos.get(u.id) ?? null));
  }

  async buscarPorCodigoPostal(codigoPostal: string): Promise<Ubicacion[]> {
    const ubicaciones = await this.prisma.ubicacion.findMany({
      where: { codigoPostal, estado: { not: 'Eliminado' } },
    });
    const ids = ubicaciones.map(u => u.id);
    const puntos = await this.leerPuntosGeograficosMultiples(ids);
    return ubicaciones.map(u => this.toEntity(u, puntos.get(u.id) ?? null));
  }

  async buscarPorEstado(estado: string): Promise<Ubicacion[]> {
    const ubicaciones = await this.prisma.ubicacion.findMany({ where: { estado } });
    const ids = ubicaciones.map(u => u.id);
    const puntos = await this.leerPuntosGeograficosMultiples(ids);
    return ubicaciones.map(u => this.toEntity(u, puntos.get(u.id) ?? null));
  }

  async actualizar(
    id: number,
    barrioId?: number,
    direccion?: string,
    codigoPostal?: string,
    estado?: string,
    puntoGeografico?: string
  ): Promise<Ubicacion> {
    try {
      const existente = await this.prisma.ubicacion.findUnique({ where: { id } });
      if (!existente) throw new Error(`Ubicacion con ID ${id} no existe`);

      const data: any = {};
      if (direccion !== undefined) data.direccion = direccion.trim();
      if (codigoPostal !== undefined) data.codigoPostal = codigoPostal ? codigoPostal.trim() : null;
      if (barrioId !== undefined) data.barrioId = barrioId;
      if (estado !== undefined) data.estado = estado;

      const actualizada = await this.prisma.ubicacion.update({ where: { id }, data });

      if (puntoGeografico) {
        await this.guardarPuntoGeografico(id, puntoGeografico);
      }

      await this.invalidarCache(existente.barrioId);
      if (barrioId && barrioId !== existente.barrioId) {
        await this.invalidarCache(barrioId);
      }

      const puntoGuardado = puntoGeografico ? await this.leerPuntoGeografico(id) : null;
      return this.toEntity(actualizada, puntoGuardado);
    } catch (error: any) {
      if (error.message?.includes('P0001')) throw new UbicacionFueraDeRangoError();
      throw error;
    }
  }

  async eliminar(id: number): Promise<Ubicacion> {
    const ubicacion = await this.prisma.ubicacion.findUnique({ where: { id } });
    if (!ubicacion) throw new Error(`Ubicacion con ID ${id} no existe`);

    const centrosSalud = await this.prisma.centroSalud.count({ where: { ubicacionId: id } });
    if (centrosSalud > 0)
      throw new Error(`No se puede eliminar: tiene ${centrosSalud} centro(s) de salud asociado(s)`);

    const horarios = await this.prisma.horario.count({ where: { ubicacionId: id } });
    if (horarios > 0)
      throw new Error(`No se puede eliminar: tiene ${horarios} horario(s) asociado(s)`);

    const citas = await this.prisma.cita.count({ where: { ubicacionId: id } });
    if (citas > 0)
      throw new Error(`No se puede eliminar: tiene ${citas} cita(s) asociada(s)`);

    const pacientes = await this.prisma.paciente.count({ where: { ubicacionId: id } });
    if (pacientes > 0)
      throw new Error(`No se puede eliminar: hay ${pacientes} paciente(s) asociado(s)`);

    const eliminada = await this.prisma.ubicacion.update({
      where: { id },
      data: { estado: 'Eliminado' },
    });

    await this.invalidarCache(ubicacion.barrioId);
    return this.toEntity(eliminada);
  }

  private async invalidarCache(barrioId: number): Promise<void> {
    await Promise.all([
      this.cache.del(this.CACHE_KEY),
      this.cache.del(this.CACHE_KEY_POR_BARRIO(barrioId)),
    ]);
  }

  private async leerPuntoGeografico(id: number): Promise<string | null> {
    try {
      const resultado = await this.prisma.$queryRaw<Array<{ punto_geografico: string }>>`
        SELECT ST_AsGeoJSON("punto_geografico") as punto_geografico
        FROM "ubicaciones"
        WHERE "id_ubicacion" = ${id}
      `;
      return resultado?.[0]?.punto_geografico ?? null;
    } catch {
      return null;
    }
  }

  private async leerPuntosGeograficosMultiples(ids: number[]): Promise<Map<number, string | null>> {
    const resultado = new Map<number, string | null>();
    if (ids.length === 0) return resultado;
    ids.forEach(id => resultado.set(id, null));
    try {
      const puntos = await this.prisma.$queryRaw<Array<{ id_ubicacion: number; punto_geografico: string }>>`
        SELECT "id_ubicacion", ST_AsGeoJSON("punto_geografico") as punto_geografico
        FROM "ubicaciones"
        WHERE "id_ubicacion" = ANY(${ids}::integer[])
      `;
      puntos.forEach(p => {
        if (p.punto_geografico) resultado.set(p.id_ubicacion, p.punto_geografico);
      });
    } catch {
      // retornar mapa con null en caso de error
    }
    return resultado;
  }

  private async guardarPuntoGeografico(id: number, puntoGeografico: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE "ubicaciones"
      SET "punto_geografico" = ST_SetSRID(ST_GeomFromGeoJSON(${puntoGeografico}::jsonb), 4326)
      WHERE "id_ubicacion" = ${id}
    `;
  }
}