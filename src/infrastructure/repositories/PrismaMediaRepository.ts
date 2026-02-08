import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { IMediaRepository } from '../../domain/repositories/IMediaRepository';
import { Media, EstadoMedia } from '../../domain/entities/Media';
import { FiltroMediaDto } from '../../application/dtos/MediaDtos';

@injectable()
export class PrismaMediaRepository implements IMediaRepository {
  constructor(
    @inject('PrismaClient') private prisma: PrismaClient
  ) {}

  async crear(media: Media): Promise<Media> {
    const mediaCreada = await this.prisma.media.create({
      data: {
        archivo: media.archivo,
        nombre: media.nombre,
        tipoMime: media.tipoMime,
        tamanioBytes: media.tamanioBytes,
        estado: media.estado
      }
    });

    return this.mapearAEntidad(mediaCreada);
  }

  async obtenerPorId(id: number): Promise<Media | null> {
    const media = await this.prisma.media.findUnique({
      where: { id }
    });

    return media ? this.mapearAEntidad(media) : null;
  }

  async obtenerTodos(filtros: FiltroMediaDto): Promise<Media[]> {
    const where: any = {
      estado: 'Activo'
    };

    if (filtros.tipoMime) {
      where.tipoMime = {
        contains: filtros.tipoMime
      };
    }

    const mediaList = await this.prisma.media.findMany({
      where,
      orderBy: { fechaSubida: 'desc' },
      take: filtros.limite || 50,
      skip: filtros.offset || 0
    });

    return mediaList.map(m => this.mapearAEntidad(m));
  }

  async actualizar(id: number, datos: Partial<Media>): Promise<Media | null> {
    try {
      const mediaActualizada = await this.prisma.media.update({
        where: { id },
        data: {
          nombre: datos.nombre,
          estado: datos.estado
        }
      });

      return this.mapearAEntidad(mediaActualizada);
    } catch (error) {
      return null;
    }
  }

  async eliminar(id: number): Promise<boolean> {
    try {
      // Soft delete
      await this.prisma.media.update({
        where: { id },
        data: { estado: 'Eliminado' }
      });
      return true;
    } catch (error) {
      console.error('Error al eliminar media:', error);
      return false;
    }
  }

  async contarPorTipo(tipoMime: string): Promise<number> {
    return await this.prisma.media.count({
      where: {
        tipoMime: {
          contains: tipoMime
        },
        estado: 'Activo'
      }
    });
  }

  private mapearAEntidad(data: any): Media {
    return new Media(
      data.id,
      data.archivo,
      data.nombre,
      data.tipoMime,
      data.tamanioBytes,
      data.estado as EstadoMedia,
      data.fechaSubida
    );
  }
}
