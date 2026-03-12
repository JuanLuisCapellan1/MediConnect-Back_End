import { PrismaClient, Prisma } from '@prisma/client';
import { ICentroSaludRepository } from '../../domain/repositories/ICentroSaludRepository';
import { RedisCacheService } from '../external-services/RedisCacheService';

export class PrismaCentroSaludRepository implements ICentroSaludRepository {
  constructor(private prisma: PrismaClient, private redis: RedisCacheService) { }

  // ─── Nuevos métodos ────────────────────────────────────────────────────────

  async obtenerPerfilCompleto(usuarioId: number): Promise<any | null> {
    return await this.prisma.centroSalud.findUnique({
      where: { usuarioId },
      include: {
        usuario: {
          select: { id: true, email: true, telefono: true, fotoPerfil: true, emailVerificado: true }
        },
        tipoCentro: true,
        ubicacion: {
          include: {
            barrio: {
              include: { seccion: true }
            },
          }
        },
      }
    });
  }

  async actualizarPerfil(usuarioId: number, datos: {
    nombreComercial?: string;
    rnc?: string;
    tipoCentroId?: number;
    sitio_web?: string;
    descripcion?: string;
  }): Promise<any> {
    const dataUpdate: any = { actualizadoEn: new Date() };
    if (datos.nombreComercial !== undefined) dataUpdate.nombreComercial = datos.nombreComercial;
    if (datos.rnc !== undefined) dataUpdate.rnc = datos.rnc;
    if (datos.tipoCentroId !== undefined) dataUpdate.tipoCentroId = datos.tipoCentroId;
    if (datos.sitio_web !== undefined) dataUpdate.sitio_web = datos.sitio_web;
    if (datos.descripcion !== undefined) dataUpdate.descripcion = datos.descripcion;

    return await this.prisma.centroSalud.update({
      where: { usuarioId },
      data: dataUpdate,
      include: {
        usuario: { select: { id: true, email: true, telefono: true, fotoPerfil: true } },
        tipoCentro: true,
        ubicacion: { include: { barrio: { include: { seccion: true } } } }
      }
    });
  }

  async actualizarFotoPerfil(usuarioId: number, url: string): Promise<any> {
    return await this.prisma.centroSalud.update({
      where: { usuarioId },
      data: { foto_perfil: url, actualizadoEn: new Date() },
      include: {
        usuario: { select: { id: true, email: true, fotoPerfil: true } },
        tipoCentro: true,
        ubicacion: true,
      }
    });
  }

  async obtenerUbicacion(usuarioId: number): Promise<any | null> {
    const centro = await this.prisma.centroSalud.findUnique({
      where: { usuarioId },
      include: {
        ubicacion: {
          include: {
            barrio: { include: { seccion: true } },
          }
        }
      }
    });
    return (centro as any)?.ubicacion ?? null;
  }

  async actualizarUbicacion(usuarioId: number, datos: {
    barrioId?: number;
    direccion?: string;
    codigoPostal?: string | null;
  }): Promise<any> {
    const centro = await this.prisma.centroSalud.findUnique({
      where: { usuarioId },
      select: { ubicacionId: true }
    });
    if (!centro) throw new Error('Centro de salud no encontrado');

    const dataUpdate: any = {};
    if (datos.barrioId !== undefined) dataUpdate.barrioId = datos.barrioId;
    if (datos.direccion !== undefined) dataUpdate.direccion = datos.direccion;
    if (datos.codigoPostal !== undefined) dataUpdate.codigoPostal = datos.codigoPostal;

    return await this.prisma.ubicacion.update({
      where: { id: centro.ubicacionId },
      data: dataUpdate,
      include: {
        barrio: { include: { seccion: true } },
      }
    });
  }

  async listarDoctoresAsociados(centroSaludId: number): Promise<any[]> {
    const solicitudes = await this.prisma.solicitudAlianza.findMany({
      where: { centroSaludId, estado: 'Aceptada' },
      include: {
        doctor: {
          include: {
            usuario: {
              select: { email: true, telefono: true, fotoPerfil: true }
            },
            especialidades: {
              select: { id_especialidad: true, es_principal: true }
            },
            servicios: {
              where: { estado: 'Activo' },
              select: { id: true, nombre: true, precio: true }
            }
          }
        }
      },
      orderBy: { actualizadoEn: 'desc' }
    });
    return solicitudes.map((s: any) => ({
      solicitudId: s.id,
      aliadoDesde: s.actualizadoEn ?? s.creadoEn,
      doctor: s.doctor
    }));
  }

  // ─── Métodos legacy ────────────────────────────────────────────────────────

  async obtenerPorId(usuarioId: number): Promise<any | null> {
    return await this.prisma.centroSalud.findUnique({
      where: { usuarioId },
      include: { usuario: true, tipoCentro: true, ubicacion: true },
    });
  }

  async obtenerPorUsuarioId(usuarioId: number): Promise<any | null> {
    return await this.obtenerPorId(usuarioId);
  }

  async crear(datos: any): Promise<any> {
    return await this.prisma.centroSalud.create({
      data: datos,
      include: { usuario: true, tipoCentro: true, ubicacion: true },
    });
  }

  async actualizar(usuarioId: number, datos: any): Promise<any> {
    return await this.prisma.centroSalud.update({
      where: { usuarioId },
      data: datos,
      include: { usuario: true, tipoCentro: true, ubicacion: true },
    });
  }

  async listar(): Promise<any[]> {
    return await this.prisma.centroSalud.findMany({
      include: { usuario: true, tipoCentro: true, ubicacion: true },
    });
  }

  // ─── BÚSQUEDA GEOGRÁFICA ────────────────────────────────────────────────────
  async buscarCercanos(
    lat?: number,
    lng?: number,
    radioKm?: number,
    filtros?: { tipoCentroId?: number; estadoVerificacion?: string; nombre?: string },
  ): Promise<any[]> {
    const useGeo = lat != null && lng != null && radioKm != null;
    const radioMetros = useGeo ? radioKm! * 1000 : 0;
    const estadoVerif = filtros?.estadoVerificacion ?? 'Aprobado';

    const condiciones: Prisma.Sql[] = [];
    if (filtros?.tipoCentroId) {
      condiciones.push(Prisma.sql`cs.id_tipo_centro = ${filtros.tipoCentroId}`);
    }
    if (filtros?.nombre) {
      const termino = `%${filtros.nombre}%`;
      condiciones.push(Prisma.sql`LOWER(cs.nombre_comercial) ILIKE LOWER(${termino})`);
    }
    const extraWhere = condiciones.length > 0
      ? Prisma.sql`AND ${Prisma.join(condiciones, ' AND ')}`
      : Prisma.sql``;

    // ── 1. Obtener IDs (+ distancia opcional) con raw SQL ──────────────────
    let rows: { id: number; distancia_metros: number | null }[];

    if (useGeo) {
      rows = await this.prisma.$queryRaw<{ id: number; distancia_metros: number }[]>`
        SELECT DISTINCT ON (cs.id_usuario)
          cs.id_usuario AS id,
          ST_Distance(
            u.punto_geografico::geography,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
          ) AS distancia_metros
        FROM centros_salud cs
        JOIN ubicaciones u ON u.id_ubicacion = cs.id_ubicacion
                          AND u.punto_geografico IS NOT NULL
        WHERE cs.estado              = 'Activo'
          AND cs.estado_verificacion = ${estadoVerif}
          AND ST_DWithin(
                u.punto_geografico::geography,
                ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
                ${radioMetros}
              )
        ${extraWhere}
        ORDER BY cs.id_usuario, distancia_metros ASC
      `;
    } else {
      rows = await this.prisma.$queryRaw<{ id: number; distancia_metros: null }[]>`
        SELECT cs.id_usuario AS id, NULL::double precision AS distancia_metros
        FROM centros_salud cs
        WHERE cs.estado              = 'Activo'
          AND cs.estado_verificacion = ${estadoVerif}
        ${extraWhere}
        ORDER BY cs.id_usuario
      `;
    }

    if (rows.length === 0) return [];

    const distanciaMap = new Map<number, number | null>();
    for (const r of rows) {
      distanciaMap.set(Number(r.id), r.distancia_metros != null ? Number(r.distancia_metros) : null);
    }
    const idsOrdenados = useGeo
      ? [...distanciaMap.entries()].sort((a, b) => (a[1] ?? 0) - (b[1] ?? 0)).map(([id]) => id)
      : [...distanciaMap.keys()];

    // ── 2. Carga batch de datos completos ──────────────────────────────────
    const centros = await this.prisma.centroSalud.findMany({
      where: { usuarioId: { in: idsOrdenados } },
      include: {
        usuario: { select: { id: true, email: true, telefono: true, fotoPerfil: true } },
        tipoCentro: { select: { id: true, nombre: true } },
        ubicacion: {
          select: {
            id: true, direccion: true, codigoPostal: true, nombre: true,
            barrio: { select: { id: true, nombre: true } },
          },
        },
      },
    });

    // ── 3. Enriquecer ubicaciones con coords PostGIS ────────────────────────
    const ubicIds = centros.map((c: any) => c.ubicacion?.id).filter(Boolean) as number[];
    if (ubicIds.length > 0) {
      const geoRows = await this.prisma.$queryRaw<{
        id: number; latitud: number | null; longitud: number | null;
        barrio_nombre: string | null; municipio_nombre: string | null; provincia_nombre: string | null;
      }[]>`
        SELECT
          u.id_ubicacion                     AS id,
          ST_Y(u.punto_geografico::geometry) AS latitud,
          ST_X(u.punto_geografico::geometry) AS longitud,
          b.nombre                           AS barrio_nombre,
          m.nombre                           AS municipio_nombre,
          p.nombre                           AS provincia_nombre
        FROM ubicaciones u
        LEFT JOIN barrios              b  ON b.id_barrio             = u.id_barrio
        LEFT JOIN secciones            s  ON s.id_seccion             = b.id_seccion
        LEFT JOIN distritos_municipales dm ON dm.id_distrito_municipal = s.id_distrito_municipal
        LEFT JOIN municipios           m  ON m.id_municipio           = COALESCE(dm.id_municipio, s.id_municipio)
        LEFT JOIN provincias           p  ON p.id_provincia           = m.id_provincia
        WHERE u.id_ubicacion IN (${Prisma.join(ubicIds)})
      `;
      const geoMap = new Map<number, typeof geoRows[0]>();
      for (const row of geoRows) geoMap.set(Number(row.id), row);

      for (const c of centros) {
        if (!c.ubicacion?.id) continue;
        const geo = geoMap.get((c.ubicacion as any).id);
        if (!geo) continue;
        (c.ubicacion as any).latitud = geo.latitud != null ? Number(geo.latitud) : null;
        (c.ubicacion as any).longitud = geo.longitud != null ? Number(geo.longitud) : null;
        const partes: string[] = [];
        if ((c.ubicacion as any).direccion) partes.push((c.ubicacion as any).direccion.trim());
        if (geo.barrio_nombre) partes.push(geo.barrio_nombre.trim());
        if (geo.municipio_nombre) partes.push(geo.municipio_nombre.trim());
        if (geo.provincia_nombre) partes.push(geo.provincia_nombre.trim());
        (c.ubicacion as any).direccionCompleta = partes.join(', ');
      }
    }

    // ── 4. Ordenar y adjuntar distancia ────────────────────────────────────
    const centrosMap = new Map<number, any>();
    for (const c of centros) centrosMap.set(c.usuarioId, c);

    return idsOrdenados
      .map(id => {
        const c = centrosMap.get(id);
        if (!c) return null;
        return {
          ...c,
          distanciaMetros: distanciaMap.get(id) != null ? Math.round(distanciaMap.get(id)!) : null,
        };
      })
      .filter(Boolean);
  }

  // ─── ANALÍTICAS DEL CENTRO ──────────────────────────────────────────────────

  async estadisticasGenerales(centroSaludId: number): Promise<{
    totalMedicos: number;
    totalEspecialidades: number;
    citasSemanaActual: number;
    valoracionPromedio: number | null;
  }> {
    // Doctores afiliados del centro (solicitudes Aceptadas)
    const solicitudes = await this.prisma.solicitudAlianza.findMany({
      where: { centroSaludId, estado: 'Aceptada' },
      select: {
        doctorId: true,
        doctor: {
          select: {
            calificacionPromedio: true,
            especialidades: { select: { id_especialidad: true } },
          }
        }
      }
    });

    const totalMedicos = solicitudes.length;

    // Especialidades únicas de todos los doctores afiliados
    const especialidadesSet = new Set<number>();
    for (const s of solicitudes) {
      for (const esp of (s.doctor as any).especialidades) {
        especialidadesSet.add(esp.id_especialidad);
      }
    }
    const totalEspecialidades = especialidadesSet.size;

    // Rango de la semana actual (Lunes–Domingo UTC)
    const now = new Date();
    const dow = now.getUTCDay() === 0 ? 6 : now.getUTCDay() - 1;
    const inicioSemana = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dow));
    const finSemana = new Date(Date.UTC(inicioSemana.getUTCFullYear(), inicioSemana.getUTCMonth(), inicioSemana.getUTCDate() + 7));

    const doctorIds = solicitudes.map((s: any) => s.doctorId);

    const citasSemanaActual = doctorIds.length > 0
      ? await (this.prisma.cita as any).count({
        where: {
          doctorUsuarioId: { in: doctorIds },
          fechaInicio: { gte: inicioSemana, lt: finSemana },
        }
      })
      : 0;

    // Promedio de calificación de los doctores afiliados
    const ratings = solicitudes
      .map((s: any) => s.doctor.calificacionPromedio)
      .filter((r: any) => r != null)
      .map((r: any) => parseFloat(r.toString()));

    const valoracionPromedio = ratings.length > 0
      ? Math.round((ratings.reduce((acc: number, r: number) => acc + r, 0) / ratings.length) * 100) / 100
      : null;

    return { totalMedicos, totalEspecialidades, citasSemanaActual, valoracionPromedio };
  }

  async crecimientoMedicos(centroSaludId: number, periodo: string): Promise<{
    periodo: string;
    puntos: { label: string; total: number; nuevos: number }[];
    totalActual: number;
  }> {
    const now = new Date();
    const MESES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const DIAS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // Obtener TODAS las alianzas aceptadas con su fecha de aceptación
    const alianzas = await this.prisma.solicitudAlianza.findMany({
      where: { centroSaludId, estado: 'Aceptada' },
      select: { actualizadoEn: true, creadoEn: true },
      orderBy: { actualizadoEn: 'asc' },
    });

    // Fecha de afiliación = actualizadoEn (cuando se acepta) ?? creadoEn
    const fechas = alianzas.map((a: any) => new Date(a.actualizadoEn ?? a.creadoEn));
    const totalActual = fechas.length;

    let desde: Date;
    let groupBy: 'dia' | 'semana' | 'mes';

    if (periodo === 'semana') {
      const dow = now.getUTCDay() === 0 ? 6 : now.getUTCDay() - 1;
      desde = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dow));
      groupBy = 'dia';
    } else if (periodo === 'mes') {
      desde = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      groupBy = 'semana';
    } else if (periodo === '3meses') {
      desde = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1));
      groupBy = 'mes';
    } else if (periodo === 'año') {
      desde = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth() + 1, 1));
      groupBy = 'mes';
    } else {
      // todo
      const primera = fechas[0];
      desde = primera
        ? new Date(Date.UTC(primera.getUTCFullYear(), primera.getUTCMonth(), 1))
        : new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      groupBy = 'mes';
    }

    // Generar mapa de puntos vacíos
    const puntoMap = new Map<string, number>();

    if (groupBy === 'dia') {
      const dow2 = now.getUTCDay() === 0 ? 6 : now.getUTCDay() - 1;
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dow2 + (6 - i)));
        const key = d.toISOString().substring(0, 10);
        puntoMap.set(key, 0);
        (puntoMap as any).__label = (puntoMap as any).__label ?? {};
        ((puntoMap as any).__label)[key] = DIAS_ES[d.getUTCDay()];
      }
    } else if (groupBy === 'semana') {
      for (let sem = 1; sem <= 4; sem++) puntoMap.set(`Sem ${sem}`, 0);
    } else {
      const cursor = new Date(desde);
      while (cursor <= now) {
        const key = `${MESES_ES[cursor.getUTCMonth()]} ${cursor.getUTCFullYear()}`;
        puntoMap.set(key, 0);
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      }
    }

    // Contar nuevos médicos por período
    const labelMap: Record<string, string> = {};
    if (groupBy === 'dia') {
      const dow3 = now.getUTCDay() === 0 ? 6 : now.getUTCDay() - 1;
      for (let i = 0; i < 7; i++) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dow3 + i));
        const key = d.toISOString().substring(0, 10);
        labelMap[key] = DIAS_ES[d.getUTCDay()];
      }
    }

    for (const fecha of fechas) {
      if (fecha < desde) continue;
      let key: string;
      if (groupBy === 'dia') {
        key = fecha.toISOString().substring(0, 10);
      } else if (groupBy === 'semana') {
        const semNum = Math.min(Math.ceil(fecha.getUTCDate() / 7), 4);
        key = `Sem ${semNum}`;
      } else {
        key = `${MESES_ES[fecha.getUTCMonth()]} ${fecha.getUTCFullYear()}`;
      }
      if (puntoMap.has(key)) puntoMap.set(key, (puntoMap.get(key) ?? 0) + 1);
    }

    // Calcular total acumulado: médicos anteriores al rango
    let acumuladoBase = fechas.filter(f => f < desde).length;

    const puntos = [...puntoMap.entries()].map(([key, nuevos]) => {
      acumuladoBase += nuevos;
      return {
        label: labelMap[key] ?? key,
        total: acumuladoBase,
        nuevos,
      };
    });

    return { periodo, puntos, totalActual };
  }

  async distribucionEspecialidades(centroSaludId: number): Promise<{
    especialidades: { id: number; nombre: string; totalMedicos: number; porcentaje: number }[];
    total: number;
  }> {
    // Doctores afiliados
    const solicitudes: any[] = await (this.prisma.solicitudAlianza as any).findMany({
      where: { centroSaludId, estado: 'Aceptada' },
      select: {
        doctor: {
          select: {
            especialidades: {
              select: {
                id_especialidad: true,
                especialidades: { select: { id: true, nombre: true } }
              }
            }
          }
        }
      }
    });

    // Contar médicos por especialidad
    const conteoMap = new Map<number, { nombre: string; count: number }>();
    for (const s of solicitudes) {
      for (const esp of s.doctor.especialidades) {
        const id = esp.id_especialidad;
        const nombre = esp.especialidades?.nombre ?? `Especialidad ${id}`;
        if (!conteoMap.has(id)) conteoMap.set(id, { nombre, count: 0 });
        conteoMap.get(id)!.count++;
      }
    }

    // Denominador = total de asignaciones especialidad-médico
    // (un médico con 2 especialidades cuenta en ambas)
    const totalAsignaciones = [...conteoMap.values()].reduce((acc, { count }) => acc + count, 0);

    const especialidades = [...conteoMap.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([id, { nombre, count }]) => ({
        id,
        nombre,
        totalMedicos: count,
        porcentaje: totalAsignaciones > 0 ? Math.round((count / totalAsignaciones) * 10000) / 100 : 0,
      }));

    return { especialidades, total: conteoMap.size };
  }
}
