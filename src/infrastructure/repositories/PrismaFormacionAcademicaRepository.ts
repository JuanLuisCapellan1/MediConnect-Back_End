import { PrismaClient } from '@prisma/client';
import { injectable } from 'tsyringe';
import { IFormacionAcademicaRepository } from '../../domain/repositories/IFormacionAcademicaRepository';
import { FormacionAcademica } from '../../domain/entities/FormacionAcademica';
import { RedisCacheService } from '../external-services/RedisCacheService';

@injectable()
export class PrismaFormacionAcademicaRepository implements IFormacionAcademicaRepository {
    private readonly CACHE_KEY_PREFIX = 'formaciones_academicas:';
    private readonly CACHE_KEY_DOCTOR_PREFIX = 'formaciones_academicas:doctor:';
    private readonly CACHE_TTL = 3600; // 1 hora

    constructor(
        private prisma: PrismaClient,
        private redis: RedisCacheService
    ) { }

    async crear(
        doctorId: number,
        universidadId: number,
        especialidadId: number,
        fechaInicio: Date,
        estado: string,
        fechaFinalizacion?: Date
    ): Promise<FormacionAcademica> {
        const nuevaFormacion = await this.prisma.formacionAcademica.create({
            data: {
                doctorId,
                universidadId,
                especialidadId,
                fecha_inicio: fechaInicio,
                fecha_finalizacion: fechaFinalizacion,
                estado,
            },
            include: {
                universidad: {
                    select: {
                        nombre: true,
                        pais: {
                            select: {
                                nombre: true,
                            },
                        },
                    },
                },
                especialidad: {
                    select: {
                        nombre: true,
                    },
                },
            },
        });

        // Invalidar todas las claves de cache del doctor (incluyendo paginación)
        await this.redis.deleteByPattern(`${this.CACHE_KEY_DOCTOR_PREFIX}${doctorId}:*`);

        return this.mapearEntidad(nuevaFormacion);
    }

    async obtenerPorId(id: number): Promise<FormacionAcademica | null> {
        const cacheKey = `${this.CACHE_KEY_PREFIX}${id}`;

        // Verificar cache
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const encontrada = await this.prisma.formacionAcademica.findUnique({
            where: { id },
            include: {
                universidad: {
                    select: {
                        nombre: true,
                        pais: {
                            select: {
                                nombre: true,
                            },
                        },
                    },
                },
                especialidad: {
                    select: {
                        nombre: true,
                    },
                },
            },
        });

        if (!encontrada) {
            return null;
        }

        const entidad = this.mapearEntidad(encontrada);

        // Guardar en cache
        await this.redis.set(cacheKey, JSON.stringify(entidad), this.CACHE_TTL);

        return entidad;
    }

    async obtenerTodos(
        doctorId?: number,
        universidadId?: number,
        especialidadId?: number,
        estado?: string,
        busqueda?: string,
        pagina: number = 1,
        limite: number = 10
    ): Promise<{ formaciones: FormacionAcademica[]; total: number }> {
        const where: any = {};

        if (doctorId) {
            where.doctorId = doctorId;
        }

        if (universidadId) {
            where.universidadId = universidadId;
        }

        if (especialidadId) {
            where.especialidadId = especialidadId;
        }

        if (estado) {
            where.estado = estado;
        }

        if (busqueda) {
            where.OR = [
                {
                    universidad: {
                        nombre: {
                            contains: busqueda,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    especialidad: {
                        nombre: {
                            contains: busqueda,
                            mode: 'insensitive',
                        },
                    },
                },
            ];
        }

        const [formaciones, total] = await Promise.all([
            this.prisma.formacionAcademica.findMany({
                where,
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: [
                    { estado: 'asc' }, // Activo primero
                    { fecha_inicio: 'desc' }, // Más reciente primero
                ],
                include: {
                    universidad: {
                        select: {
                            nombre: true,
                            pais: {
                                select: {
                                    nombre: true,
                                },
                            },
                        },
                    },
                    especialidad: {
                        select: {
                            nombre: true,
                        },
                    },
                },
            }),
            this.prisma.formacionAcademica.count({ where }),
        ]);

        return {
            formaciones: formaciones.map(this.mapearEntidad),
            total,
        };
    }

    async obtenerPorDoctor(
        doctorId: number,
        pagina: number = 1,
        limite: number = 20
    ): Promise<{ formaciones: FormacionAcademica[]; total: number }> {
        // Cache key específica para este doctor
        const cacheKey = `${this.CACHE_KEY_DOCTOR_PREFIX}${doctorId}:p${pagina}:l${limite}`;

        // Solo cachear la primera página con límite por defecto
        const esConsultaPorDefecto = pagina === 1 && limite === 20;

        if (esConsultaPorDefecto) {
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        }

        const where = {
            doctorId,
            estado: 'Activo', // Solo formaciones activas
        };

        const [formaciones, total] = await Promise.all([
            this.prisma.formacionAcademica.findMany({
                where,
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: [
                    { fecha_inicio: 'desc' }, // Más reciente primero
                ],
                include: {
                    universidad: {
                        select: {
                            nombre: true,
                            pais: {
                                select: {
                                    nombre: true,
                                },
                            },
                        },
                    },
                    especialidad: {
                        select: {
                            nombre: true,
                        },
                    },
                },
            }),
            this.prisma.formacionAcademica.count({ where }),
        ]);

        const resultado = {
            formaciones: formaciones.map(this.mapearEntidad),
            total,
        };

        // Guardar en cache si es consulta por defecto
        if (esConsultaPorDefecto) {
            await this.redis.set(cacheKey, JSON.stringify(resultado), this.CACHE_TTL);
        }

        return resultado;
    }

    async actualizar(
        id: number,
        universidadId?: number,
        especialidadId?: number,
        fechaInicio?: Date,
        fechaFinalizacion?: Date,
        estado?: string
    ): Promise<FormacionAcademica> {
        // Obtener la formación actual para invalidar cache del doctor
        const formacionActual = await this.prisma.formacionAcademica.findUnique({
            where: { id },
            select: { doctorId: true },
        });

        const data: any = {};

        if (universidadId !== undefined) {
            data.universidadId = universidadId;
        }

        if (especialidadId !== undefined) {
            data.especialidadId = especialidadId;
        }

        if (fechaInicio !== undefined) {
            data.fecha_inicio = fechaInicio;
        }

        if (fechaFinalizacion !== undefined) {
            data.fecha_finalizacion = fechaFinalizacion;
        }

        if (estado !== undefined) {
            data.estado = estado;
        }

        data.actualizadoEn = new Date();

        const actualizada = await this.prisma.formacionAcademica.update({
            where: { id },
            data,
            include: {
                universidad: {
                    select: {
                        nombre: true,
                        pais: {
                            select: {
                                nombre: true,
                            },
                        },
                    },
                },
                especialidad: {
                    select: {
                        nombre: true,
                    },
                },
            },
        });

        // Invalidar caches
        await this.redis.del(`${this.CACHE_KEY_PREFIX}${id}`);
        if (formacionActual) {
            await this.redis.deleteByPattern(`${this.CACHE_KEY_DOCTOR_PREFIX}${formacionActual.doctorId}:*`);
        }

        return this.mapearEntidad(actualizada);
    }

    async eliminar(id: number): Promise<void> {
        // Obtener la formación para invalidar cache del doctor
        const formacion = await this.prisma.formacionAcademica.findUnique({
            where: { id },
            select: { doctorId: true },
        });

        // Soft delete: actualizar estado a "Eliminado"
        await this.prisma.formacionAcademica.update({
            where: { id },
            data: {
                estado: 'Eliminado',
                actualizadoEn: new Date(),
            },
        });

        // Invalidar caches
        await this.redis.del(`${this.CACHE_KEY_PREFIX}${id}`);
        if (formacion) {
            await this.redis.deleteByPattern(`${this.CACHE_KEY_DOCTOR_PREFIX}${formacion.doctorId}:*`);
        }
    }

    async verificarDoctorExiste(doctorId: number): Promise<boolean> {
        const doctor = await this.prisma.doctor.findUnique({
            where: { usuarioId: doctorId },
        });
        return doctor !== null;
    }

    async verificarUniversidadExiste(universidadId: number): Promise<boolean> {
        const universidad = await this.prisma.universidad.findUnique({
            where: { id: universidadId },
        });
        return universidad !== null;
    }

    async verificarEspecialidadExiste(especialidadId: number): Promise<boolean> {
        const especialidad = await this.prisma.especialidad.findUnique({
            where: { id: especialidadId },
        });
        return especialidad !== null;
    }

    async verificarFormacionDuplicada(
        doctorId: number,
        universidadId: number,
        especialidadId: number,
        idExcluir?: number
    ): Promise<boolean> {
        const where: any = {
            doctorId,
            universidadId,
            especialidadId,
            estado: { not: 'Eliminado' },
        };

        // Si se proporciona un ID a excluir, agregarlo al where
        if (idExcluir !== undefined) {
            where.id = { not: idExcluir };
        }

        const formacion = await this.prisma.formacionAcademica.findFirst({
            where,
        });

        return formacion !== null;
    }

    private mapearEntidad(data: any): FormacionAcademica {
        return new FormacionAcademica(
            data.id,
            data.doctorId,
            data.universidadId,
            data.especialidadId,
            data.fecha_inicio,
            data.estado,
            data.creadoEn,
            data.fecha_finalizacion,
            data.actualizadoEn,
            // Mapear objetos relacionados si existen
            data.universidad
                ? {
                    nombre: data.universidad.nombre,
                    pais: { nombre: data.universidad.pais.nombre },
                }
                : undefined,
            data.especialidad ? { nombre: data.especialidad.nombre } : undefined
        );
    }
}
