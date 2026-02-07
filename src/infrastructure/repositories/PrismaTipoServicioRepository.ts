import { PrismaClient } from '@prisma/client';
import { ITipoServicioRepository } from '../../domain/repositories/ITipoServicioRepository';
import { TipoServicio } from '../../domain/entities/TipoServicio';
import {
  CrearTipoServicioDto,
  ActualizarTipoServicioDto,
  FiltroTiposServiciosDto,
} from '../../application/dtos/TipoServicioDtos';

export class PrismaTipoServicioRepository implements ITipoServicioRepository {
  constructor(private prisma: PrismaClient) {}

  private mapearEntidad(data: any): TipoServicio {
    return new TipoServicio({
      id: data.id,
      nombre: data.nombre,
      descripcion: data.descripcion,
      estado: data.estado,
      creadoEn: data.creadoEn,
    });
  }

  async crear(datos: CrearTipoServicioDto): Promise<TipoServicio> {
    const nuevo = await this.prisma.tipoServicio.create({
      data: {
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        estado: datos.estado || 'Activo',
      },
    });
    return this.mapearEntidad(nuevo);
  }

  async obtenerPorId(id: number): Promise<TipoServicio | null> {
    const encontrado = await this.prisma.tipoServicio.findUnique({
      where: { id },
    });
    return encontrado ? this.mapearEntidad(encontrado) : null;
  }

  async obtenerTodas(
    filtros: FiltroTiposServiciosDto
  ): Promise<{ datos: TipoServicio[]; total: number }> {
    const pagina = filtros.pagina || 1;
    const limite = filtros.limite || 10;
    const skip = (pagina - 1) * limite;

    const where: any = {};
    if (filtros.nombre) {
      where.nombre = { contains: filtros.nombre, mode: 'insensitive' };
    }
    if (filtros.estado) {
      where.estado = filtros.estado;
    } else {
        where.estado = { not: 'Eliminado' };
    }

    const [datos, total] = await Promise.all([
      this.prisma.tipoServicio.findMany({
        where,
        skip,
        take: limite,
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.tipoServicio.count({ where }),
    ]);

    return {
      datos: datos.map((d) => this.mapearEntidad(d)),
      total,
    };
  }

  async actualizar(
    id: number,
    datos: ActualizarTipoServicioDto
  ): Promise<TipoServicio> {
    const actualizado = await this.prisma.tipoServicio.update({
      where: { id },
      data: {
        ...datos,
      },
    });
    return this.mapearEntidad(actualizado);
  }

  async eliminar(id: number): Promise<void> {
    await this.prisma.tipoServicio.update({
      where: { id },
      data: { estado: 'Eliminado' },
    });
  }

  async existeNombre(nombre: string, excluirId?: number): Promise<boolean> {
    const where: any = {
      nombre: { equals: nombre, mode: 'insensitive' },
      estado: { not: 'Eliminado' },
    };

    if (excluirId) {
      where.id = { not: excluirId };
    }
    const count = await this.prisma.tipoServicio.count({ where });
    return count > 0;
  }
}
