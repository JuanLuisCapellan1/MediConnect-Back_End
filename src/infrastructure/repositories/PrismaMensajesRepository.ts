import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { IMensajesRepository } from '../../domain/repositories/IMensajesRepository';
import { Mensaje, TipoMensaje, EstadoMensaje } from '../../domain/entities/Mensaje';
import {
  FiltroMensajesDto,
  MensajeConRemitenteDto
} from '../../application/dtos/MensajeDtos';

interface IMensajesRepositoryExtendido extends IMensajesRepository {
  obtenerConRemitentesPorId(id: number): Promise<MensajeConRemitenteDto | null>;
}

@injectable()
export class PrismaMensajesRepository implements IMensajesRepositoryExtendido {
  constructor(
    @inject('PrismaClient') private prisma: PrismaClient
  ) { }

  async crear(mensaje: Mensaje): Promise<Mensaje> {
    const mensajeCreado = await this.prisma.mensaje.create({
      data: {
        conversacionId: mensaje.conversacionId,
        remitenteId: mensaje.remitenteId,
        contenido: mensaje.contenido,
        tipo: mensaje.tipo.toLowerCase(), // Normalizar a minúsculas
        mediaId: mensaje.mediaId,
        estado: mensaje.estado
      }
    });

    // Actualizar timestamp de la conversación
    await this.prisma.conversacion.update({
      where: { id: mensaje.conversacionId },
      data: { actualizadoEn: new Date() }
    });

    return this.mapearAEntidad(mensajeCreado);
  }

  async obtenerPorId(id: number): Promise<Mensaje | null> {
    const mensaje = await this.prisma.mensaje.findUnique({
      where: { id }
    });

    return mensaje ? this.mapearAEntidad(mensaje) : null;
  }

  async obtenerPorConversacion(filtros: FiltroMensajesDto): Promise<{
    mensajes: MensajeConRemitenteDto[];
    total: number;
    pagina: number;
    limite: number;
    hayMas: boolean;
  }> {
    // Verificar que el usuario tenga acceso a la conversación
    const conversacion = await this.prisma.conversacion.findFirst({
      where: {
        id: filtros.conversacionId,
        OR: [
          { emisorId: filtros.usuarioId },
          { receptorId: filtros.usuarioId }
        ]
      }
    });

    if (!conversacion) {
      throw new Error('No tienes acceso a esta conversación');
    }

    const limite = filtros.limite || 50;
    const pagina = filtros.pagina && filtros.pagina > 0 ? filtros.pagina : 1;
    const skip = filtros.offset !== undefined
      ? filtros.offset
      : (pagina - 1) * limite;

    const where: any = {
      conversacionId: filtros.conversacionId,
      estado: { not: 'Eliminado' }
    };

    if (filtros.tipo) {
      where.tipo = filtros.tipo;
    }

    if (filtros.busqueda) {
      where.contenido = {
        contains: filtros.busqueda,
        mode: 'insensitive'
      };
    }

    if (filtros.antesDeId) {
      where.id = { lt: filtros.antesDeId };
    }

    // Contar total y obtener mensajes en paralelo
    const [total, mensajes] = await Promise.all([
      this.prisma.mensaje.count({ where }),
      this.prisma.mensaje.findMany({
        where,
        include: {
          remitente: {
            select: {
              id: true,
              fotoPerfil: true,
              paciente: { select: { nombre: true, apellido: true } },
              doctor: { select: { nombre: true, apellido: true } }
            }
          },
          media: {
            select: {
              id: true,
              archivo: true,
              nombre: true,
              tipoMime: true,
              tamanioBytes: true
            }
          }
        },
        orderBy: { id: 'desc' },   // Mayor ID = más reciente
        take: limite,
        skip
      })
    ]);

    return {
      mensajes: mensajes.map(m => ({
        id: m.id,
        conversacionId: m.conversacionId,
        remitenteId: m.remitenteId,
        contenido: m.contenido || undefined,
        tipo: m.tipo,
        mediaId: m.mediaId || undefined,
        estado: m.estado,
        enviadoEn: m.enviadoEn,
        remitente: {
          id: m.remitente.id,
          nombre: m.remitente.paciente?.nombre || m.remitente.doctor?.nombre || 'Sin nombre',
          apellido: m.remitente.paciente?.apellido || m.remitente.doctor?.apellido || '',
          fotoPerfil: m.remitente.fotoPerfil || undefined
        },
        media: m.media ? {
          id: m.media.id,
          archivo: m.media.archivo,
          nombre: m.media.nombre || undefined,
          tipoMime: m.media.tipoMime || undefined,
          tamanioBytes: m.media.tamanioBytes ? Number(m.media.tamanioBytes) : undefined
        } : undefined,
        esPropio: m.remitenteId === filtros.usuarioId
      })),
      total,
      pagina,
      limite,
      hayMas: skip + mensajes.length < total
    };
  }

  async actualizar(id: number, datos: Partial<Mensaje>): Promise<Mensaje | null> {
    try {
      const mensajeActualizado = await this.prisma.mensaje.update({
        where: { id },
        data: {
          contenido: datos.contenido
        }
      });

      return this.mapearAEntidad(mensajeActualizado);
    } catch (error) {
      return null;
    }
  }

  async eliminar(id: number, remitenteId: number): Promise<boolean> {
    try {
      // Verificar que el mensaje pertenece al remitente
      const mensaje = await this.prisma.mensaje.findFirst({
        where: { id, remitenteId }
      });

      if (!mensaje) {
        return false;
      }

      // Soft delete: cambiar estado a Eliminado y limpiar contenido
      await this.prisma.mensaje.update({
        where: { id },
        data: {
          estado: 'Eliminado',
          contenido: null
        }
      });

      return true;
    } catch (error) {
      console.error('Error al eliminar mensaje:', error);
      return false;
    }
  }

  async contarPorConversacion(conversacionId: number): Promise<number> {
    return await this.prisma.mensaje.count({
      where: {
        conversacionId,
        estado: { not: 'Eliminado' }
      }
    });
  }

  async contarNoLeidosPorConversacion(conversacionId: number, usuarioId: number): Promise<number> {
    // Obtener el último mensaje leído por el usuario
    const lectura = await this.prisma.lecturaConversacion.findUnique({
      where: {
        conversacionId_usuarioId: {
          conversacionId,
          usuarioId
        }
      }
    });

    return await this.prisma.mensaje.count({
      where: {
        conversacionId,
        remitenteId: { not: usuarioId },
        estado: { not: 'Eliminado' },
        id: lectura?.ultimoMensajeLeidoId
          ? { gt: lectura.ultimoMensajeLeidoId }
          : undefined
      }
    });
  }

  async obtenerUltimoPorConversacion(conversacionId: number): Promise<Mensaje | null> {
    const mensaje = await this.prisma.mensaje.findFirst({
      where: {
        conversacionId,
        estado: { not: 'Eliminado' }
      },
      orderBy: { enviadoEn: 'desc' }
    });

    return mensaje ? this.mapearAEntidad(mensaje) : null;
  }

  async buscarEnConversacion(conversacionId: number, busqueda: string, limite: number = 20): Promise<MensajeConRemitenteDto[]> {
    const mensajes = await this.prisma.mensaje.findMany({
      where: {
        conversacionId,
        contenido: {
          contains: busqueda,
          mode: 'insensitive'
        },
        estado: { not: 'Eliminado' }
      },
      include: {
        remitente: {
          select: {
            id: true,
            fotoPerfil: true,
            paciente: {
              select: {
                nombre: true,
                apellido: true
              }
            },
            doctor: {
              select: {
                nombre: true,
                apellido: true
              }
            }
          }
        },
        media: {
          select: {
            id: true,
            archivo: true,
            nombre: true,
            tipoMime: true,
            tamanioBytes: true
          }
        }
      },
      orderBy: { enviadoEn: 'desc' },
      take: limite
    });

    return mensajes.map(m => ({
      id: m.id,
      conversacionId: m.conversacionId,
      remitenteId: m.remitenteId,
      contenido: m.contenido || undefined,
      tipo: m.tipo,
      mediaId: m.mediaId || undefined,
      estado: m.estado,
      enviadoEn: m.enviadoEn,
      remitente: {
        id: m.remitente.id,
        nombre: m.remitente.paciente?.nombre || m.remitente.doctor?.nombre || 'Sin nombre',
        apellido: m.remitente.paciente?.apellido || m.remitente.doctor?.apellido || '',
        fotoPerfil: m.remitente.fotoPerfil || undefined
      },
      media: m.media ? {
        id: m.media.id,
        archivo: m.media.archivo,
        nombre: m.media.nombre || undefined,
        tipoMime: m.media.tipoMime || undefined,
        tamanioBytes: m.media.tamanioBytes ? Number(m.media.tamanioBytes) : undefined
      } : undefined
    }));
  }

  async obtenerConRemitentesPorId(id: number): Promise<MensajeConRemitenteDto | null> {
    const mensaje = await this.prisma.mensaje.findUnique({
      where: { id },
      include: {
        remitente: {
          select: {
            id: true,
            fotoPerfil: true,
            paciente: {
              select: {
                nombre: true,
                apellido: true
              }
            },
            doctor: {
              select: {
                nombre: true,
                apellido: true
              }
            }
          }
        },
        media: {
          select: {
            id: true,
            archivo: true,
            nombre: true,
            tipoMime: true,
            tamanioBytes: true
          }
        }
      }
    });

    if (!mensaje) return null;

    return {
      id: mensaje.id,
      conversacionId: mensaje.conversacionId,
      remitenteId: mensaje.remitenteId,
      contenido: mensaje.contenido || undefined,
      tipo: mensaje.tipo,
      mediaId: mensaje.mediaId || undefined,
      estado: mensaje.estado,
      enviadoEn: mensaje.enviadoEn,
      remitente: {
        id: mensaje.remitente.id,
        nombre: mensaje.remitente.paciente?.nombre || mensaje.remitente.doctor?.nombre || 'Sin nombre',
        apellido: mensaje.remitente.paciente?.apellido || mensaje.remitente.doctor?.apellido || '',
        fotoPerfil: mensaje.remitente.fotoPerfil || undefined
      },
      media: mensaje.media ? {
        id: mensaje.media.id,
        archivo: mensaje.media.archivo,
        nombre: mensaje.media.nombre || undefined,
        tipoMime: mensaje.media.tipoMime || undefined,
        tamanioBytes: mensaje.media.tamanioBytes ? Number(mensaje.media.tamanioBytes) : undefined
      } : undefined
    };
  }

  private mapearAEntidad(data: any): Mensaje {
    return new Mensaje(
      data.id,
      data.conversacionId,
      data.remitenteId,
      data.contenido,
      data.tipo as TipoMensaje,
      data.mediaId,
      data.estado as EstadoMensaje,
      data.enviadoEn
    );
  }
}
