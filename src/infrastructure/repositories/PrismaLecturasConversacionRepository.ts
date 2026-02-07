import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { ILecturasConversacionRepository } from '../../domain/repositories/ILecturasConversacionRepository';
import { LecturaConversacion } from '../../domain/entities/LecturaConversacion';
import { MarcarMensajesLeidosDto } from '../../application/dtos/MensajeDtos';

@injectable()
export class PrismaLecturasConversacionRepository implements ILecturasConversacionRepository {
  constructor(
    @inject('PrismaClient') private prisma: PrismaClient
  ) {}

  async crear(lectura: LecturaConversacion): Promise<LecturaConversacion> {
    const lecturaCreada = await this.prisma.lecturaConversacion.create({
      data: {
        conversacionId: lectura.conversacionId,
        usuarioId: lectura.usuarioId,
        ultimoMensajeLeidoId: lectura.ultimoMensajeLeidoId
      }
    });

    return this.mapearAEntidad(lecturaCreada);
  }

  async obtenerPorConversacionYUsuario(conversacionId: number, usuarioId: number): Promise<LecturaConversacion | null> {
    const lectura = await this.prisma.lecturaConversacion.findUnique({
      where: {
        conversacionId_usuarioId: {
          conversacionId,
          usuarioId
        }
      }
    });

    return lectura ? this.mapearAEntidad(lectura) : null;
  }

  async actualizarUltimoMensajeLeido(dto: MarcarMensajesLeidosDto): Promise<LecturaConversacion> {
    // Verificar que el usuario tenga acceso a la conversación
    const conversacion = await this.prisma.conversacion.findFirst({
      where: {
        id: dto.conversacionId,
        OR: [
          { emisorId: dto.usuarioId },
          { receptorId: dto.usuarioId }
        ]
      }
    });

    if (!conversacion) {
      throw new Error('No tienes acceso a esta conversación');
    }

    // Verificar que el mensaje existe en la conversación
    const mensaje = await this.prisma.mensaje.findFirst({
      where: {
        id: dto.ultimoMensajeLeidoId,
        conversacionId: dto.conversacionId
      }
    });

    if (!mensaje) {
      throw new Error('Mensaje no encontrado en esta conversación');
    }

    // Usar upsert para crear o actualizar
    const lecturaActualizada = await this.prisma.lecturaConversacion.upsert({
      where: {
        conversacionId_usuarioId: {
          conversacionId: dto.conversacionId,
          usuarioId: dto.usuarioId
        }
      },
      update: {
        ultimoMensajeLeidoId: dto.ultimoMensajeLeidoId,
        leidoEn: new Date()
      },
      create: {
        conversacionId: dto.conversacionId,
        usuarioId: dto.usuarioId,
        ultimoMensajeLeidoId: dto.ultimoMensajeLeidoId
      }
    });

    return this.mapearAEntidad(lecturaActualizada);
  }

  async obtenerMensajesNoLeidosPorUsuario(usuarioId: number): Promise<Map<number, number>> {
    // Obtener todas las conversaciones del usuario
    const conversaciones = await this.prisma.conversacion.findMany({
      where: {
        OR: [
          { emisorId: usuarioId },
          { receptorId: usuarioId }
        ],
        estado: 'Activa'
      },
      include: {
        lecturas: {
          where: { usuarioId }
        }
      }
    });

    const mapaNoLeidos = new Map<number, number>();

    // Para cada conversación, contar mensajes no leídos
    for (const conv of conversaciones) {
      const lectura = conv.lecturas[0];
      
      const countNoLeidos = await this.prisma.mensaje.count({
        where: {
          conversacionId: conv.id,
          remitenteId: { not: usuarioId },
          estado: { not: 'Eliminado' },
          id: lectura?.ultimoMensajeLeidoId 
            ? { gt: lectura.ultimoMensajeLeidoId }
            : undefined
        }
      });

      if (countNoLeidos > 0) {
        mapaNoLeidos.set(conv.id, countNoLeidos);
      }
    }

    return mapaNoLeidos;
  }

  async eliminarPorConversacion(conversacionId: number): Promise<boolean> {
    try {
      await this.prisma.lecturaConversacion.deleteMany({
        where: { conversacionId }
      });
      return true;
    } catch (error) {
      console.error('Error al eliminar lecturas de conversación:', error);
      return false;
    }
  }

  private mapearAEntidad(data: any): LecturaConversacion {
    return new LecturaConversacion(
      data.conversacionId,
      data.usuarioId,
      data.ultimoMensajeLeidoId,
      data.leidoEn
    );
  }
}
