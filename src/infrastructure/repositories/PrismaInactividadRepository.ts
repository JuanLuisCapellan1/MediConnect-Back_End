import { PrismaClient } from '@prisma/client';
import { IInactividadRepository } from '../../domain/repositories/IInactividadRepository';

export class PrismaInactividadRepository implements IInactividadRepository {
    constructor(private prisma: PrismaClient) { }

    async crear(datos: { doctorId: number; fechaInicio: Date; fechaFin: Date; motivo?: string }): Promise<any> {
        return await (this.prisma as any).periodos_inactividad.create({
            data: {
                id_doctor: datos.doctorId,
                fecha_inicio: datos.fechaInicio,
                fecha_fin: datos.fechaFin,
                motivo: datos.motivo ?? null,
                estado: 'Activo',
            },
        });
    }

    async buscarPorId(id: number): Promise<any | null> {
        return await (this.prisma as any).periodos_inactividad.findUnique({
            where: { id_periodo: id },
        });
    }

    async listarPorDoctor(doctorId: number): Promise<any[]> {
        return await (this.prisma as any).periodos_inactividad.findMany({
            where: { id_doctor: doctorId },
            orderBy: { fecha_inicio: 'desc' },
        });
    }

    async cancelar(id: number): Promise<any> {
        return await (this.prisma as any).periodos_inactividad.update({
            where: { id_periodo: id },
            data: { estado: 'Cancelado', actualizado_en: new Date() },
        });
    }

    async buscarSolapantes(doctorId: number, desde: Date, hasta: Date): Promise<any[]> {
        return await (this.prisma as any).periodos_inactividad.findMany({
            where: {
                id_doctor: doctorId,
                estado: 'Activo',
                fecha_inicio: { lt: hasta },
                fecha_fin: { gt: desde },
            },
        });
    }
}
