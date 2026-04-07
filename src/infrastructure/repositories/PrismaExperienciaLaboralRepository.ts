import { PrismaClient } from '@prisma/client';
import { injectable } from 'tsyringe';
import { IExperienciaLaboralRepository } from '../../domain/repositories/IExperienciaLaboralRepository';
import { ExperienciaLaboral } from '../../domain/entities/ExperienciaLaboral';
import { RedisCacheService } from '../external-services/RedisCacheService';

@injectable()
export class PrismaExperienciaLaboralRepository implements IExperienciaLaboralRepository {
    private readonly CACHE_KEY_PREFIX = 'experiencias_laborales:';
    private readonly CACHE_KEY_DOCTOR_PREFIX = 'experiencias_laborales:doctor:';
    private readonly CACHE_TTL = 3600; // 1 hora

    constructor(
        private prisma: PrismaClient,
        private redis: RedisCacheService
    ) { }

    async crear(experiencia: ExperienciaLaboral): Promise<ExperienciaLaboral> {
        const nuevaExperiencia = await this.prisma.experienciaLaboral.create({
            data: {
                doctorId: experiencia.doctorId,
                institucion: experiencia.institucion,
                posicion: experiencia.posicion,
                fechaInicio: experiencia.fechaInicio,
                fechaFinalizacion: experiencia.fechaFinalizacion,
                trabajaActualmente: experiencia.trabajaActualmente,
                estado: experiencia.estado,
            },
        });

        // Invalidar cache del doctor
        await this.redis.deleteByPattern(`${this.CACHE_KEY_DOCTOR_PREFIX}${experiencia.doctorId}:*`);

        return this.mapearEntidad(nuevaExperiencia);
    }

    async obtenerPorId(id: number): Promise<ExperienciaLaboral | null> {
        const cacheKey = `${this.CACHE_KEY_PREFIX}${id}`;

        // Verificar cache
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const encontrada = await this.prisma.experienciaLaboral.findUnique({
            where: { id },
        });

        if (!encontrada) {
            return null;
        }

        const experiencia = this.mapearEntidad(encontrada);

        // Guardar en cache
        await this.redis.set(cacheKey, JSON.stringify(experiencia), this.CACHE_TTL);

        return experiencia;
    }

    async obtenerTodos(
        doctorId?: number,
        estado?: string,
        busqueda?: string,
        pagina: number = 1,
        limite: number = 10
    ): Promise<{ experiencias: ExperienciaLaboral[]; total: number }> {
        const cacheKey = `${this.CACHE_KEY_DOCTOR_PREFIX}${doctorId}:${estado || 'all'}:${busqueda || 'all'}:${pagina}:${limite}`;

        // Verificar cache
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const where: any = {};

        if (doctorId) {
            where.doctorId = doctorId;
        }

        if (estado) {
            where.estado = estado;
        }

        if (busqueda) {
            where.OR = [
                { institucion: { contains: busqueda, mode: 'insensitive' } },
                { posicion: { contains: busqueda, mode: 'insensitive' } },
            ];
        }

        const [experiencias, total] = await Promise.all([
            this.prisma.experienciaLaboral.findMany({
                where,
                orderBy: [
                    { trabajaActualmente: 'desc' }, // Actuales primero
                    { fechaInicio: 'desc' }, // Más recientes primero
                ],
                skip: (pagina - 1) * limite,
                take: limite,
            }),
            this.prisma.experienciaLaboral.count({ where }),
        ]);

        const resultado = {
            experiencias: experiencias.map(e => this.mapearEntidad(e)),
            total,
        };

        // Guardar en cache
        await this.redis.set(cacheKey, JSON.stringify(resultado), this.CACHE_TTL);

        return resultado;
    }

    async actualizar(id: number, datos: Partial<ExperienciaLaboral>): Promise<ExperienciaLaboral> {
        // Obtener experiencia actual para invalidar cache
        const experienciaActual = await this.prisma.experienciaLaboral.findUnique({
            where: { id },
            select: { doctorId: true },
        });

        if (!experienciaActual) {
            throw new Error(`No se encontró la experiencia laboral con ID: ${id}`);
        }

        const actualizada = await this.prisma.experienciaLaboral.update({
            where: { id },
            data: {
                institucion: datos.institucion,
                posicion: datos.posicion,
                fechaInicio: datos.fechaInicio,
                fechaFinalizacion: datos.fechaFinalizacion,
                trabajaActualmente: datos.trabajaActualmente,
                estado: datos.estado,
                actualizadoEn: new Date(),
            },
        });

        // Invalidar cache
        await this.redis.del(`${this.CACHE_KEY_PREFIX}${id}`);
        await this.redis.deleteByPattern(`${this.CACHE_KEY_DOCTOR_PREFIX}${experienciaActual.doctorId}:*`);

        return this.mapearEntidad(actualizada);
    }

    async eliminar(id: number): Promise<void> {
        // Obtener experiencia para invalidar cache
        const experiencia = await this.prisma.experienciaLaboral.findUnique({
            where: { id },
            select: { doctorId: true },
        });

        if (!experiencia) {
            throw new Error(`No se encontró la experiencia laboral con ID: ${id}`);
        }

        // Soft delete
        await this.prisma.experienciaLaboral.update({
            where: { id },
            data: {
                estado: 'Eliminado',
                actualizadoEn: new Date(),
            },
        });

        // Invalidar cache
        await this.redis.del(`${this.CACHE_KEY_PREFIX}${id}`);
        await this.redis.deleteByPattern(`${this.CACHE_KEY_DOCTOR_PREFIX}${experiencia.doctorId}:*`);
    }

    async verificarDoctorExiste(doctorId: number): Promise<boolean> {
        const doctor = await this.prisma.doctor.findUnique({
            where: { usuarioId: doctorId },
        });
        return doctor !== null;
    }

    private mapearEntidad(data: any): ExperienciaLaboral {
        return new ExperienciaLaboral(
            data.id,
            data.doctorId,
            data.institucion,
            data.posicion,
            data.fechaInicio,
            data.estado,
            data.creadoEn,
            data.fechaFinalizacion,
            data.trabajaActualmente,
            data.actualizadoEn
        );
    }
}
