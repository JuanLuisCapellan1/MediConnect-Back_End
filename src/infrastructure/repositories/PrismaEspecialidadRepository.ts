import { PrismaClient } from '@prisma/client';
import { IEspecialidadRepository } from '../../domain/repositories/IEspecialidadRepository';
import { Especialidad } from '../../domain/entities/Especialidad';
import {
    CrearEspecialidadDto,
    ActualizarEspecialidadDto,
    FiltroEspecialidadesDto,
} from '../../application/dtos/EspecialidadDtos';

export class PrismaEspecialidadRepository implements IEspecialidadRepository {
    constructor(private prisma: PrismaClient) { }

    private mapearEntidad(data: any): Especialidad {
        return new Especialidad({
            id: data.id,
            nombre: data.nombre,
            descripcion: data.descripcion,
            estado: data.estado,
            creadoEn: data.creadoEn,
        });
    }

    async crear(datos: CrearEspecialidadDto): Promise<Especialidad> {
        const nuevo = await this.prisma.especialidad.create({
            data: {
                nombre: datos.nombre,
                descripcion: datos.descripcion,
                estado: datos.estado || 'Activo',
            },
        });
        return this.mapearEntidad(nuevo);
    }

    async obtenerPorId(id: number): Promise<Especialidad | null> {
        const encontrado = await this.prisma.especialidad.findUnique({
            where: { id },
        });
        return encontrado ? this.mapearEntidad(encontrado) : null;
    }

    async obtenerTodas(
        filtros: FiltroEspecialidadesDto
    ): Promise<{ datos: Especialidad[]; total: number }> {
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
            this.prisma.especialidad.findMany({
                where,
                skip,
                take: limite,
                orderBy: { nombre: 'asc' },
            }),
            this.prisma.especialidad.count({ where }),
        ]);

        return {
            datos: datos.map((d) => this.mapearEntidad(d)),
            total,
        };
    }

    async actualizar(
        id: number,
        datos: ActualizarEspecialidadDto
    ): Promise<Especialidad> {
        const actualizado = await this.prisma.especialidad.update({
            where: { id },
            data: {
                ...datos,
            },
        });
        return this.mapearEntidad(actualizado);
    }

    async eliminar(id: number): Promise<void> {
        await this.prisma.especialidad.update({
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
        const count = await this.prisma.especialidad.count({ where });
        return count > 0;
    }
}
