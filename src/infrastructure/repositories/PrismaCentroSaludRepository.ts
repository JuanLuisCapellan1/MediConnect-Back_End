import { PrismaClient } from '@prisma/client';
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
