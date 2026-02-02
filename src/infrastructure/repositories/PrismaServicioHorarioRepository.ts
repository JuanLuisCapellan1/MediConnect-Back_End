/**
 * Repositorio Prisma para ServicioHorario
 * Implementa la interfaz IServicioHorarioRepository
 */
import { PrismaClient } from '@prisma/client';
import { ServicioHorario } from '../../domain/entities/ServicioHorario';
import { IServicioHorarioRepository } from '../../domain/repositories/IServicioHorarioRepository';
import {
  CrearServicioHorarioDto,
  ActualizarServicioHorarioDto,
  FiltroServiciosHorariosDto,
} from '../../application/dtos/ServicioHorarioDtos';
import { ServicioHorarioYaExisteError } from '../../domain/errors/ServiciosHorarios/ServicioHorarioYaExisteError';
import { ServicioHorarioNoEncontradoError } from '../../domain/errors/ServiciosHorarios/ServicioHorarioNoEncontradoError';

export class PrismaServicioHorarioRepository implements IServicioHorarioRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Mapea los datos de Prisma a la entidad ServicioHorario
   */
  private mapearEntidad(data: any): ServicioHorario {
    return new ServicioHorario({
      servicioId: data.servicioId,
      horarioId: data.horarioId,
      estado: data.estado,
      creadoEn: data.creadoEn,
    });
  }

  async crear(datos: CrearServicioHorarioDto): Promise<ServicioHorario> {
    try {
      const resultado = await this.prisma.servicioHorario.create({
        data: {
          servicioId: datos.servicioId,
          horarioId: datos.horarioId,
          estado: datos.estado || 'Activo',
        },
      });

      return this.mapearEntidad(resultado);
    } catch (error: any) {
      // Maneja violaciones de constraint de clave foránea
      if (error.code === 'P2003') {
        const constraint = error.meta?.constraint;
        if (constraint === 'servicios_horarios_id_servicio_fkey') {
          throw new Error(`El servicio con ID ${datos.servicioId} no existe en la base de datos`);
        } else if (constraint === 'servicios_horarios_id_horario_fkey') {
          throw new Error(`El horario con ID ${datos.horarioId} no existe en la base de datos`);
        }
      }
      // Maneja violación de constraint único (relación duplicada)
      if (error.code === 'P2002') {
        throw new ServicioHorarioYaExisteError(datos.servicioId, datos.horarioId);
      }
      throw error;
    }
  }

  async obtenerPorIds(
    servicioId: number,
    horarioId: number
  ): Promise<ServicioHorario | null> {
    const resultado = await this.prisma.servicioHorario.findUnique({
      where: {
        servicioId_horarioId: {
          servicioId,
          horarioId,
        },
      },
    });

    return resultado ? this.mapearEntidad(resultado) : null;
  }

  async obtenerPorServicio(servicioId: number): Promise<ServicioHorario[]> {
    const resultados = await this.prisma.servicioHorario.findMany({
      where: {
        servicioId,
      },
      orderBy: {
        horarioId: 'asc',
      },
    });

    return resultados.map((r) => this.mapearEntidad(r));
  }

  async obtenerPorHorario(horarioId: number): Promise<ServicioHorario[]> {
    const resultados = await this.prisma.servicioHorario.findMany({
      where: {
        horarioId,
      },
      orderBy: {
        servicioId: 'asc',
      },
    });

    return resultados.map((r) => this.mapearEntidad(r));
  }

  async obtenerTodas(
    filtros: FiltroServiciosHorariosDto
  ): Promise<{ datos: ServicioHorario[]; total: number }> {
    const pagina = filtros.pagina || 1;
    const limite = filtros.limite || 10;
    const skip = (pagina - 1) * limite;

    const whereClause: any = {};
    if (filtros.servicioId) whereClause.servicioId = filtros.servicioId;
    if (filtros.horarioId) whereClause.horarioId = filtros.horarioId;
    if (filtros.estado) whereClause.estado = filtros.estado;

    const [resultados, total] = await Promise.all([
      this.prisma.servicioHorario.findMany({
        where: whereClause,
        skip,
        take: limite,
        orderBy: {
          creadoEn: 'desc',
        },
      }),
      this.prisma.servicioHorario.count({
        where: whereClause,
      }),
    ]);

    return {
      datos: resultados.map((r) => this.mapearEntidad(r)),
      total,
    };
  }

  async actualizar(
    servicioId: number,
    horarioId: number,
    datos: ActualizarServicioHorarioDto
  ): Promise<ServicioHorario> {
    // Verifica que exista la relación original
    const existe = await this.existe(servicioId, horarioId);
    if (!existe) {
      throw new ServicioHorarioNoEncontradoError(servicioId, horarioId);
    }

    // Si se proporciona una nueva combinación de IDs, validar y ejecutar cambio
    const nuevoServicioId = datos.servicioId ?? servicioId;
    const nuevoHorarioId = datos.horarioId ?? horarioId;

    // Si cambió la combinación, validar que no exista ya
    if (datos.servicioId !== undefined || datos.horarioId !== undefined) {
      if (nuevoServicioId !== servicioId || nuevoHorarioId !== horarioId) {
        const existeNuevaCombinacion = await this.existe(nuevoServicioId, nuevoHorarioId);
        if (existeNuevaCombinacion) {
          throw new ServicioHorarioYaExisteError(nuevoServicioId, nuevoHorarioId);
        }

        // Validar que el nuevo servicio existe
        const servicioExiste = await this.servicioExiste(nuevoServicioId);
        if (!servicioExiste) {
          throw new Error(`El servicio con ID ${nuevoServicioId} no existe en la base de datos o está inactivo`);
        }

        // Validar que el nuevo horario existe
        const horarioExiste = await this.horarioExiste(nuevoHorarioId);
        if (!horarioExiste) {
          throw new Error(`El horario con ID ${nuevoHorarioId} no existe en la base de datos o está inactivo`);
        }

        // Eliminar la relación antigua y crear la nueva con el mismo estado
        const relacionActual = await this.obtenerPorIds(servicioId, horarioId);
        await this.prisma.servicioHorario.delete({
          where: {
            servicioId_horarioId: {
              servicioId,
              horarioId,
            },
          },
        });

        const resultado = await this.prisma.servicioHorario.create({
          data: {
            servicioId: nuevoServicioId,
            horarioId: nuevoHorarioId,
            estado: datos.estado ?? relacionActual!.estado,
          },
        });

        return this.mapearEntidad(resultado);
      }
    }

    // Si solo cambió el estado
    const resultado = await this.prisma.servicioHorario.update({
      where: {
        servicioId_horarioId: {
          servicioId,
          horarioId,
        },
      },
      data: {
        estado: datos.estado,
      },
    });

    return this.mapearEntidad(resultado);
  }

  async eliminar(servicioId: number, horarioId: number): Promise<void> {
    // Verifica que exista la relación
    const existe = await this.existe(servicioId, horarioId);
    if (!existe) {
      throw new ServicioHorarioNoEncontradoError(servicioId, horarioId);
    }

    await this.prisma.servicioHorario.update({
      where: {
        servicioId_horarioId: {
          servicioId,
          horarioId,
        },
      },
      data: {
        estado: 'Eliminado',
      },
    });
  }

  async existe(servicioId: number, horarioId: number): Promise<boolean> {
    const resultado = await this.prisma.servicioHorario.findUnique({
      where: {
        servicioId_horarioId: {
          servicioId,
          horarioId,
        },
      },
    });

    return !!resultado;
  }

  async contar(): Promise<number> {
    return await this.prisma.servicioHorario.count();
  }

  /**
   * Valida que un servicio existe
   */
  async servicioExiste(servicioId: number): Promise<boolean> {
    const resultado = await this.prisma.servicio.findFirst({
      where: { 
        id: servicioId,
        estado: 'Activo'
      },
    });
    return !!resultado;
  }

  /**
   * Valida que un horario existe
   */
  async horarioExiste(horarioId: number): Promise<boolean> {
    const resultado = await this.prisma.horario.findFirst({
      where: { id: horarioId, estado: 'Activo' },
    });
    return !!resultado;
  }
}
