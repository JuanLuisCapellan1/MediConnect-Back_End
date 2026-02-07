import { PrismaClient } from '@prisma/client';
import { injectable } from 'tsyringe';
import { IExperienciasLaboralesRepository } from '../../domain/repositories/IExperienciasLaboralesRepository';
import { ExperienciaLaboral } from '../../domain/entities/ExperienciaLaboral';
import { RedisCacheService } from '../external-services/RedisCacheService';

@injectable()
export class PrismaExperienciasLaboralesRepository implements IExperienciasLaboralesRepository {
  private readonly CACHE_KEY_PREFIX = 'experiencias_laborales:';
  private readonly CACHE_KEY_DOCTOR_PREFIX = 'experiencias_laborales:doctor:';
  private readonly CACHE_TTL = 3600; // 1 hora

  constructor(
    private prisma: PrismaClient,
    private redis: RedisCacheService
  ) {}

  async crear(
    doctorId: number,
    profesionId: number,
    descripcionCargo: string,
    fechaInicio: Date,
    trabajaActualmente: boolean,
    estado: string,
    centroSaludId?: number,
    institucionExterna?: string,
    fechaFinalizacion?: Date
  ): Promise<ExperienciaLaboral> {
    const nuevaExperiencia = await this.prisma.experienciaLaboral.create({
      data: {
        doctorId,
        centroSaludId,
        institucionExterna,
        profesionId,
        descripcionCargo,
        fechaInicio,
        fechaFinalizacion,
        trabajaActualmente,
        estado,
      },
      include: {
        profesion: {
          select: {
            nombre: true,
          },
        },
        centroSalud: {
          select: {
            nombreComercial: true,
          },
        },
      },
    });

    // Invalidar todas las claves de cache del doctor (incluyendo paginación)
    await this.redis.deleteByPattern(`${this.CACHE_KEY_DOCTOR_PREFIX}${doctorId}:*`);

    return this.mapearEntidad(nuevaExperiencia);
  }

  async obtenerPorId(id: number): Promise<ExperienciaLaboral | null> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${id}`;

    // Verificar cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const encontrada = await this.prisma.experienciaLaboral.findUnique({
      where: { id },
      include: {
        profesion: {
          select: {
            nombre: true,
          },
        },
        centroSalud: {
          select: {
            nombreComercial: true,
          },
        },
      },
    });

    if (!encontrada) {
      return null;
    }

    const entidad = this.mapearEntidad(encontrada);

    // Guardar en cache
    await this.redis.set(cacheKey, JSON.stringify(entidad), this.CACHE_TTL);

    return entidad;
  }

  async obtenerTodos(
    doctorId?: number,
    centroSaludId?: number,
    profesionId?: number,
    trabajaActualmente?: boolean,
    estado?: string,
    busqueda?: string,
    pagina: number = 1,
    limite: number = 10
  ): Promise<{ experiencias: ExperienciaLaboral[]; total: number }> {
    const where: any = {};

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (centroSaludId) {
      where.centroSaludId = centroSaludId;
    }

    if (profesionId) {
      where.profesionId = profesionId;
    }

    if (trabajaActualmente !== undefined) {
      where.trabajaActualmente = trabajaActualmente;
    }

    if (estado) {
      where.estado = estado;
    }

    if (busqueda) {
      where.OR = [
        {
          descripcionCargo: {
            contains: busqueda,
            mode: 'insensitive',
          },
        },
        {
          institucionExterna: {
            contains: busqueda,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [experiencias, total] = await Promise.all([
      this.prisma.experienciaLaboral.findMany({
        where,
        skip: (pagina - 1) * limite,
        take: limite,
        orderBy: [
          { trabajaActualmente: 'desc' }, // Primero los trabajos actuales
          { fechaInicio: 'desc' }, // Luego ordenar por fecha de inicio (más reciente primero)
        ],
        include: {
          profesion: {
            select: {
              nombre: true,
            },
          },
          centroSalud: {
            select: {
              nombreComercial: true,
            },
          },
        },
      }),
      this.prisma.experienciaLaboral.count({ where }),
    ]);

    return {
      experiencias: experiencias.map(this.mapearEntidad),
      total,
    };
  }

  async obtenerPorDoctor(
    doctorId: number,
    pagina: number = 1,
    limite: number = 20
  ): Promise<{ experiencias: ExperienciaLaboral[]; total: number }> {
    // Cache key específica para este doctor
    const cacheKey = `${this.CACHE_KEY_DOCTOR_PREFIX}${doctorId}:p${pagina}:l${limite}`;

    // Solo cachear la primera página con límite por defecto
    const esConsultaPorDefecto = pagina === 1 && limite === 20;

    if (esConsultaPorDefecto) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const where = {
      doctorId,
      estado: 'Activo', // Solo experiencias activas
    };

    const [experiencias, total] = await Promise.all([
      this.prisma.experienciaLaboral.findMany({
        where,
        skip: (pagina - 1) * limite,
        take: limite,
        orderBy: [
          { trabajaActualmente: 'desc' }, // Primero los trabajos actuales
          { fechaInicio: 'desc' }, // Luego ordenar por fecha de inicio
        ],
        include: {
          profesion: {
            select: {
              nombre: true,
            },
          },
          centroSalud: {
            select: {
              nombreComercial: true,
            },
          },
        },
      }),
      this.prisma.experienciaLaboral.count({ where }),
    ]);

    const resultado = {
      experiencias: experiencias.map(this.mapearEntidad),
      total,
    };

    // Guardar en cache si es consulta por defecto
    if (esConsultaPorDefecto) {
      await this.redis.set(cacheKey, JSON.stringify(resultado), this.CACHE_TTL);
    }

    return resultado;
  }

  async actualizar(
    id: number,
    centroSaludId?: number,
    institucionExterna?: string,
    profesionId?: number,
    descripcionCargo?: string,
    fechaInicio?: Date,
    fechaFinalizacion?: Date,
    trabajaActualmente?: boolean,
    estado?: string
  ): Promise<ExperienciaLaboral> {
    // Obtener la experiencia actual para invalidar cache del doctor
    const experienciaActual = await this.prisma.experienciaLaboral.findUnique({
      where: { id },
      select: { doctorId: true },
    });

    const data: any = {};

    if (centroSaludId !== undefined) {
      data.centroSaludId = centroSaludId;
    }

    if (institucionExterna !== undefined) {
      data.institucionExterna = institucionExterna;
    }

    if (profesionId !== undefined) {
      data.profesionId = profesionId;
    }

    if (descripcionCargo !== undefined) {
      data.descripcionCargo = descripcionCargo;
    }

    if (fechaInicio !== undefined) {
      data.fechaInicio = fechaInicio;
    }

    if (fechaFinalizacion !== undefined) {
      data.fechaFinalizacion = fechaFinalizacion;
    }

    if (trabajaActualmente !== undefined) {
      data.trabajaActualmente = trabajaActualmente;
    }

    if (estado !== undefined) {
      data.estado = estado;
    }

    data.actualizadoEn = new Date();

    const actualizada = await this.prisma.experienciaLaboral.update({
      where: { id },
      data,
      include: {
        doctor: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
        profesion: {
          select: {
            nombre: true,
          },
        },
        centroSalud: {
          select: {
            nombreComercial: true,
          },
        },
      },
    });

    // Invalidar caches
    await this.redis.del(`${this.CACHE_KEY_PREFIX}${id}`);
    if (experienciaActual) {
      await this.redis.deleteByPattern(`${this.CACHE_KEY_DOCTOR_PREFIX}${experienciaActual.doctorId}:*`);
    }

    return this.mapearEntidad(actualizada);
  }

  async eliminar(id: number): Promise<void> {
    // Obtener la experiencia para invalidar cache del doctor
    const experiencia = await this.prisma.experienciaLaboral.findUnique({
      where: { id },
      select: { doctorId: true },
    });

    // Soft delete: actualizar estado a "Eliminado"
    await this.prisma.experienciaLaboral.update({
      where: { id },
      data: {
        estado: 'Eliminado',
        actualizadoEn: new Date(),
      },
    });

    // Invalidar caches
    await this.redis.del(`${this.CACHE_KEY_PREFIX}${id}`);
    if (experiencia) {
      await this.redis.deleteByPattern(`${this.CACHE_KEY_DOCTOR_PREFIX}${experiencia.doctorId}:*`);
    }
  }

  async verificarDoctorExiste(doctorId: number): Promise<boolean> {
    const doctor = await this.prisma.doctor.findUnique({
      where: { usuarioId: doctorId },
    });
    return doctor !== null;
  }

  async verificarCentroSaludExiste(centroSaludId: number): Promise<boolean> {
    const centroSalud = await this.prisma.centroSalud.findUnique({
      where: { usuarioId: centroSaludId },
    });
    return centroSalud !== null;
  }

  async verificarProfesionExiste(profesionId: number): Promise<boolean> {
    const profesion = await this.prisma.profesion.findUnique({
      where: { id: profesionId },
    });
    return profesion !== null;
  }

  private mapearEntidad(data: any): ExperienciaLaboral {
    return new ExperienciaLaboral(
      data.id,
      data.doctorId,
      data.profesionId,
      data.descripcionCargo,
      data.fechaInicio,
      data.trabajaActualmente,
      data.estado,
      data.creadoEn,
      data.centroSaludId,
      data.institucionExterna,
      data.fechaFinalizacion,
      data.actualizadoEn,
      // Mapear objetos relacionados si existen
      data.profesion ? { nombre: data.profesion.nombre } : undefined,
      data.centroSalud ? { nombreComercial: data.centroSalud.nombreComercial } : undefined
    );
  }
}
