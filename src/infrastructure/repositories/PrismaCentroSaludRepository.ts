import { PrismaClient } from '@prisma/client';
import { ICentroSaludRepository } from '../../domain/repositories/ICentroSaludRepository';
import { RedisCacheService } from '../external-services/RedisCacheService';

export class PrismaCentroSaludRepository implements ICentroSaludRepository {
  constructor(private prisma: PrismaClient, private redis: RedisCacheService) {}

  async obtenerPorId(usuarioId: number): Promise<any | null> {
    return await this.prisma.centroSalud.findUnique({
      where: { usuarioId },
      include: {
        usuario: true,
        tipoCentro: true,
        ubicacion: true,
      },
    });
  }

  async obtenerPorUsuarioId(usuarioId: number): Promise<any | null> {
    return await this.prisma.centroSalud.findUnique({
      where: { usuarioId },
      include: {
        usuario: true,
        tipoCentro: true,
        ubicacion: true,
      },
    });
  }

  async crear(datos: any): Promise<any> {
    return await this.prisma.centroSalud.create({
      data: datos,
      include: {
        usuario: true,
        tipoCentro: true,
        ubicacion: true,
      },
    });
  }

  async actualizar(usuarioId: number, datos: any): Promise<any> {
    return await this.prisma.centroSalud.update({
      where: { usuarioId },
      data: datos,
      include: {
        usuario: true,
        tipoCentro: true,
        ubicacion: true,
      },
    });
  }

  async listar(): Promise<any[]> {
    return await this.prisma.centroSalud.findMany({
      include: {
        usuario: true,
        tipoCentro: true,
        ubicacion: true,
      },
    });
  }
}
