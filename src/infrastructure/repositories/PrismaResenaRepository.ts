/**
 * PrismaResenaRepository.ts
 *
 * Implementación de IResenaRepository con Prisma.
 * Tras crear o eliminar una reseña, recalcula y actualiza
 * el calificacion_promedio del Servicio y del Doctor.
 */

import { PrismaClient } from '@prisma/client';
import { Resena } from '../../domain/entities/Resena';
import { IResenaRepository, CrearResenaData } from '../../domain/repositories/IResenaRepository';

const PACIENTE_SELECT = {
    usuarioId: true,
    nombre: true,
    apellido: true,
    usuario: { select: { fotoPerfil: true } }
} as const;

const SERVICIO_SELECT = {
    id: true,
    nombre: true,
    modalidad: true,
    especialidad: { select: { id: true, nombre: true } }
} as const;

export class PrismaResenaRepository implements IResenaRepository {
    constructor(private readonly prisma: PrismaClient) { }

    // ─── Crear ───────────────────────────────────────────────────────────────
    async crear(data: CrearResenaData): Promise<Resena> {
        const p = this.prisma as any;

        const resena = await p.resena.create({
            data: {
                servicioId: data.servicioId,
                pacienteId: data.pacienteId,
                doctorId: data.doctorId,
                calificacion: data.calificacion,
                comentario: data.comentario ?? null,
                citaId: data.citaId ?? null,
                estado: 'Publicada',
            },
            include: {
                paciente: { select: PACIENTE_SELECT },
                servicio: { select: SERVICIO_SELECT },
            }
        });

        // Recalcular promedios
        await this._recalcularPromedios(data.servicioId, data.doctorId);

        return this.mapToDomain(resena);
    }

    // ─── Buscar por ID ───────────────────────────────────────────────────────
    async buscarPorId(id: number): Promise<Resena | null> {
        const p = this.prisma as any;
        const r = await p.resena.findUnique({
            where: { id },
            include: {
                paciente: { select: PACIENTE_SELECT },
                servicio: { select: SERVICIO_SELECT },
            }
        });
        if (!r) return null;
        return this.mapToDomain(r);
    }

    // ─── Listar por servicio ─────────────────────────────────────────────────
    async listarPorServicio(
        servicioId: number,
        pagina = 1,
        limite = 10
    ): Promise<{ datos: Resena[]; total: number }> {
        const p = this.prisma as any;
        const skip = (pagina - 1) * limite;

        const [total, items] = await Promise.all([
            p.resena.count({ where: { servicioId, estado: 'Publicada' } }),
            p.resena.findMany({
                where: { servicioId, estado: 'Publicada' },
                include: { paciente: { select: PACIENTE_SELECT } },
                orderBy: { creadoEn: 'desc' },
                skip,
                take: limite,
            })
        ]);

        return {
            datos: items.map((r: any) => this.mapToDomain(r)),
            total
        };
    }

    // ─── Listar por doctor ───────────────────────────────────────────────────
    async listarPorDoctor(
        doctorId: number,
        pagina = 1,
        limite = 10
    ): Promise<{ datos: Resena[]; total: number }> {
        const p = this.prisma as any;
        const skip = (pagina - 1) * limite;

        const [total, items] = await Promise.all([
            p.resena.count({ where: { doctorId, estado: 'Publicada' } }),
            p.resena.findMany({
                where: { doctorId, estado: 'Publicada' },
                include: {
                    paciente: { select: PACIENTE_SELECT },
                    servicio: { select: SERVICIO_SELECT },
                },
                orderBy: { creadoEn: 'desc' },
                skip,
                take: limite,
            })
        ]);

        return {
            datos: items.map((r: any) => this.mapToDomain(r)),
            total
        };
    }

    // ─── Listar propias (paciente) ───────────────────────────────────────────
    async listarMias(pacienteId: number): Promise<Resena[]> {
        const p = this.prisma as any;
        const items = await p.resena.findMany({
            where: { pacienteId },
            include: { servicio: { select: SERVICIO_SELECT } },
            orderBy: { creadoEn: 'desc' },
        });
        return items.map((r: any) => this.mapToDomain(r));
    }

    // ─── Verificar existencia ────────────────────────────────────────────────
    async existeResena(pacienteId: number, servicioId: number): Promise<boolean> {
        const p = this.prisma as any;
        const count = await p.resena.count({
            where: { pacienteId, servicioId }
        });
        return count > 0;
    }

    // ─── Eliminar ────────────────────────────────────────────────────────────
    async eliminar(id: number): Promise<void> {
        const p = this.prisma as any;
        const resena = await p.resena.findUnique({
            where: { id },
            select: { servicioId: true, doctorId: true }
        });
        if (!resena) throw new Error(`Reseña con ID ${id} no existe.`);

        await p.resena.update({
            where: { id },
            data: { estado: 'Eliminada' }
        });

        // Recalcular promedios tras eliminar
        await this._recalcularPromedios(resena.servicioId, resena.doctorId);
    }

    // ─── Recalcular promedios ─────────────────────────────────────────────────
    private async _recalcularPromedios(servicioId: number, doctorId: number): Promise<void> {
        const p = this.prisma as any;

        // 1. Promedio del servicio (media aritmética de sus reseñas publicadas)
        const promedioServicioResult = await p.resena.aggregate({
            where: { servicioId, estado: 'Publicada' },
            _avg: { calificacion: true },
        });
        const promedioServicio = promedioServicioResult._avg.calificacion ?? 0;

        await p.servicio.update({
            where: { id: servicioId },
            data: { calificacionPromedio: Number(promedioServicio.toFixed(2)) }
        });

        // 2. Promedio del doctor = media de los promedios de todos sus servicios activos
        const serviciosDoctor = await p.servicio.findMany({
            where: { doctorId, estado: { not: 'Eliminado' } },
            select: { calificacionPromedio: true }
        });

        const serviciosConCalificacion = serviciosDoctor
            .map((s: any) => s.calificacionPromedio ? Number(s.calificacionPromedio) : 0)
            .filter((c: number) => c > 0);

        const promedioDoctor = serviciosConCalificacion.length > 0
            ? serviciosConCalificacion.reduce((a: number, b: number) => a + b, 0) / serviciosConCalificacion.length
            : 0;

        await p.doctor.update({
            where: { usuarioId: doctorId },
            data: { calificacionPromedio: Number(promedioDoctor.toFixed(2)) }
        });
    }

    // ─── Mapper ───────────────────────────────────────────────────────────────
    private mapToDomain(r: any): Resena {
        return new Resena(
            r.id,
            r.servicioId,
            r.pacienteId,
            r.doctorId,
            r.calificacion,
            r.comentario ?? null,
            r.estado,
            r.creadoEn,
            r.actualizadoEn ?? null,
            r.citaId ?? null,
            r.paciente,
            r.doctor,
            r.servicio,
        );
    }
}
