import { PrismaClient } from '@prisma/client';
import { ITipoSeguroRepository } from '../../domain/repositories/ITipoSeguroRepository';
import { TipoSeguro } from '../../domain/entities/TipoSeguro';
import {
    CrearTipoSeguroDto,
    ActualizarTipoSeguroDto,
    FiltroTiposSegurosDto,
} from '../../application/dtos/TipoSeguroDtos';

export class PrismaTipoSeguroRepository implements ITipoSeguroRepository {
    constructor(private prisma: PrismaClient) { }

    // ============================================
    // Admin - CRUD completo
    // ============================================

    async crear(datos: CrearTipoSeguroDto): Promise<TipoSeguro> {
        const tipoSeguro = await this.prisma.tipoSeguro.create({
            data: {
                nombre: datos.nombre,
                descripcion: datos.descripcion || null,
                estado: 'Activo',
            },
        });

        return this.mapearTipoSeguro(tipoSeguro);
    }

    async obtenerPorId(id: number): Promise<TipoSeguro | null> {
        const tipoSeguro = await this.prisma.tipoSeguro.findUnique({
            where: { id },
        });

        return tipoSeguro ? this.mapearTipoSeguro(tipoSeguro) : null;
    }

    async obtenerTodos(filtros: FiltroTiposSegurosDto): Promise<{ datos: TipoSeguro[]; total: number }> {
        const pagina = filtros.pagina || 1;
        const limite = filtros.limite || 10;
        const skip = (pagina - 1) * limite;

        const where: any = {};

        if (filtros.estado) {
            where.estado = filtros.estado;
        }

        if (filtros.busqueda) {
            where.nombre = {
                contains: filtros.busqueda,
                mode: 'insensitive',
            };
        }

        const [tiposSeguros, total] = await Promise.all([
            this.prisma.tipoSeguro.findMany({
                where,
                skip,
                take: limite,
                orderBy: { nombre: 'asc' },
            }),
            this.prisma.tipoSeguro.count({ where }),
        ]);

        return {
            datos: tiposSeguros.map((ts) => this.mapearTipoSeguro(ts)),
            total,
        };
    }

    async actualizar(id: number, datos: ActualizarTipoSeguroDto): Promise<TipoSeguro> {
        const tipoSeguro = await this.prisma.tipoSeguro.update({
            where: { id },
            data: {
                ...(datos.nombre && { nombre: datos.nombre }),
                ...(datos.descripcion !== undefined && { descripcion: datos.descripcion }),
                ...(datos.estado && { estado: datos.estado }),
            },
        });

        return this.mapearTipoSeguro(tipoSeguro);
    }

    async eliminar(id: number): Promise<void> {
        await this.prisma.tipoSeguro.update({
            where: { id },
            data: { estado: 'Eliminado' },
        });
    }

    // ============================================
    // Cliente - Solo lectura
    // ============================================

    async obtenerActivos(): Promise<TipoSeguro[]> {
        const tiposSeguros = await this.prisma.tipoSeguro.findMany({
            where: { estado: 'Activo' },
            orderBy: { nombre: 'asc' },
        });

        return tiposSeguros.map((ts) => this.mapearTipoSeguro(ts));
    }

    // ============================================
    // Utilidades
    // ============================================

    async existeNombre(nombre: string, excluirId?: number): Promise<boolean> {
        const count = await this.prisma.tipoSeguro.count({
            where: {
                nombre,
                ...(excluirId && { id: { not: excluirId } }),
            },
        });
        return count > 0;
    }

    async verificarEnUso(id: number): Promise<boolean> {
        // Verificar en pacientes_seguros
        const pacientesCount = await this.prisma.pacienteSeguro.count({
            where: {
                tipoSeguroId: id,
                estado: 'Activo',
            },
        });

        if (pacientesCount > 0) {
            return true;
        }

        // Verificar en doctores_seguros
        const doctoresCount = await this.prisma.doctorSeguro.count({
            where: {
                tipoSeguroId: id,
                estado: 'Activo',
            },
        });

        return doctoresCount > 0;
    }

    // ============================================
    // Mappers
    // ============================================

    private mapearTipoSeguro(tipoSeguro: any): TipoSeguro {
        return new TipoSeguro(
            tipoSeguro.id,
            tipoSeguro.nombre,
            tipoSeguro.estado,
            tipoSeguro.creadoEn,
            tipoSeguro.descripcion
        );
    }
}
