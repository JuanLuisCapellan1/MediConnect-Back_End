/**
 * PrismaGrupoCitaRepository.ts
 * Repositorio para grupos de citas recurrentes
 */

import { PrismaClient } from '@prisma/client';
import { GrupoCita } from '../../domain/entities/GrupoCita';
import { IGrupoCitaRepository, ICrearGrupoCitaData } from '../../domain/repositories/IGrupoCitaRepository';

const GRUPO_INCLUDE = {
    citas: {
        orderBy: { fechaInicio: 'asc' as const },
        select: {
            id: true,
            fechaInicio: true,
            fechaFin: true,
            estado: true,
            horarioId: true,
            modalidad: true,
            totalAPagar: true,
        }
    }
};

export class PrismaGrupoCitaRepository implements IGrupoCitaRepository {
    constructor(private prisma: PrismaClient) { }

    async crear(datos: ICrearGrupoCitaData): Promise<GrupoCita> {
        const creado = await (this.prisma as any).grupos_citas.create({
            data: {
                id_paciente: datos.pacienteId,
                id_servicio: datos.servicioId,
                id_horario: datos.horarioId,
                fecha_inicio: datos.fechaInicio,
                fecha_fin: datos.fechaFin ?? null,
                descripcion: datos.descripcion ?? null,
                estado: 'Activo'
            },
            include: GRUPO_INCLUDE
        });
        return this.mapToDomain(creado);
    }

    async buscarPorId(id: number): Promise<GrupoCita | null> {
        const grupo = await (this.prisma as any).grupos_citas.findUnique({
            where: { id_grupo: id },
            include: GRUPO_INCLUDE
        });
        if (!grupo) return null;
        return this.mapToDomain(grupo);
    }

    async listarPorPaciente(
        pacienteId: number,
        pagina = 1,
        limite = 10
    ): Promise<{ datos: GrupoCita[]; total: number }> {
        const skip = (pagina - 1) * limite;
        const where = { id_paciente: pacienteId };

        const [datos, total] = await Promise.all([
            (this.prisma as any).grupos_citas.findMany({
                where,
                include: GRUPO_INCLUDE,
                orderBy: { creado_en: 'desc' },
                skip,
                take: limite
            }),
            (this.prisma as any).grupos_citas.count({ where })
        ]);

        return { datos: datos.map((g: any) => this.mapToDomain(g)), total };
    }

    async cancelarGrupo(grupoId: number): Promise<GrupoCita> {
        // Desactivar el grupo y cancelar todas sus citas pendientes en transacción
        const resultado = await (this.prisma as any).$transaction(async (tx: any) => {
            await tx.cita.updateMany({
                where: {
                    id_grupo: grupoId,
                    estado: { in: ['Programada', 'Reprogramada'] }
                },
                data: {
                    estado: 'Cancelada',
                    motivoCancelacion: 'Grupo de citas cancelado',
                    actualizadoEn: new Date()
                }
            });

            return await tx.grupos_citas.update({
                where: { id_grupo: grupoId },
                data: { estado: 'Cancelado' },
                include: GRUPO_INCLUDE
            });
        });

        return this.mapToDomain(resultado);
    }

    private mapToDomain(g: any): GrupoCita {
        return new GrupoCita(
            g.id_grupo,
            g.id_paciente,
            g.id_servicio,
            g.id_horario,
            g.fecha_inicio,
            g.fecha_fin ?? null,
            g.estado,
            g.creado_en,
            g.descripcion ?? null,
            g.citas ?? []
        );
    }
}
