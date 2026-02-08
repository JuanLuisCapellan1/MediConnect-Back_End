import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { INotificacionesRepository } from '../../domain/repositories/INotificacionesRepository';
import { Notificacion, TipoAlerta, TipoEntidad } from '../../domain/entities/Notificacion';
import { FiltroNotificacionesDto } from '../../application/dtos/NotificacionDtos';

@injectable()
export class PrismaNotificacionesRepository implements INotificacionesRepository {
  constructor(
    @inject('PrismaClient') private prisma: PrismaClient
  ) {}

  async crear(notificacion: Notificacion): Promise<Notificacion> {
    const notificacionCreada = await this.prisma.notificacion.create({
      data: {
        usuarioId: notificacion.usuarioId,
        titulo: notificacion.titulo,
        mensaje: notificacion.mensaje,
        tipoAlerta: notificacion.tipoAlerta,
        tipoEntidad: notificacion.tipoEntidad,
        entidadId: notificacion.entidadId,
        estado: notificacion.estado
      }
    });

    return this.mapearAEntidad(notificacionCreada);
  }

  async obtenerPorId(id: number): Promise<Notificacion | null> {
    const notificacion = await this.prisma.notificacion.findUnique({
      where: { id }
    });

    return notificacion ? this.mapearAEntidad(notificacion) : null;
  }

  async obtenerPorUsuario(filtros: FiltroNotificacionesDto): Promise<Notificacion[]> {
    const where: any = {
      usuarioId: filtros.usuarioId,
      estado: 'Activo'
    };

    // Filtrar por leídas/no leídas
    if (filtros.leidas !== undefined) {
      where.leidaEn = filtros.leidas ? { not: null } : null;
    }

    // Filtrar por tipo de alerta
    if (filtros.tipoAlerta) {
      where.tipoAlerta = filtros.tipoAlerta;
    }

    // Filtrar por tipo de entidad
    if (filtros.tipoEntidad) {
      where.tipoEntidad = filtros.tipoEntidad;
    }

    const notificaciones = await this.prisma.notificacion.findMany({
      where,
      orderBy: { creadoEn: 'desc' },
      take: filtros.limite || 50,
      skip: filtros.offset || 0
    });

    return notificaciones.map(n => this.mapearAEntidad(n));
  }

  async contarNoLeidas(usuarioId: number): Promise<number> {
    return await this.prisma.notificacion.count({
      where: {
        usuarioId,
        leidaEn: null,
        estado: 'Activo'
      }
    });
  }

  async marcarComoLeida(id: number, usuarioId: number): Promise<Notificacion | null> {
    try {
      const notificacionActualizada = await this.prisma.notificacion.update({
        where: {
          id,
          usuarioId // Asegurar que solo el usuario dueño pueda marcarla
        },
        data: {
          leidaEn: new Date()
        }
      });

      return this.mapearAEntidad(notificacionActualizada);
    } catch (error) {
      // Si no encuentra la notificación o no pertenece al usuario
      return null;
    }
  }

  async marcarVariasComoLeidas(ids: number[], usuarioId: number): Promise<number> {
    const resultado = await this.prisma.notificacion.updateMany({
      where: {
        id: { in: ids },
        usuarioId,
        leidaEn: null // Solo marcar las que no han sido leídas
      },
      data: {
        leidaEn: new Date()
      }
    });

    return resultado.count;
  }

  async marcarTodasComoLeidas(usuarioId: number): Promise<number> {
    const resultado = await this.prisma.notificacion.updateMany({
      where: {
        usuarioId,
        leidaEn: null,
        estado: 'Activo'
      },
      data: {
        leidaEn: new Date()
      }
    });

    return resultado.count;
  }

  async eliminar(id: number, usuarioId: number): Promise<boolean> {
    try {
      await this.prisma.notificacion.update({
        where: {
          id,
          usuarioId
        },
        data: {
          estado: 'Inactivo'
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async eliminarVarias(ids: number[], usuarioId: number): Promise<number> {
    const resultado = await this.prisma.notificacion.updateMany({
      where: {
        id: { in: ids },
        usuarioId
      },
      data: {
        estado: 'Inactivo'
      }
    });

    return resultado.count;
  }

  private mapearAEntidad(data: any): Notificacion {
    return new Notificacion(
      data.id,
      data.usuarioId,
      data.titulo,
      data.mensaje,
      data.tipoAlerta as TipoAlerta,
      data.tipoEntidad as TipoEntidad,
      data.entidadId,
      data.leidaEn,
      data.estado,
      data.creadoEn
    );
  }
}
