"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaFormacionAcademicaRepository = void 0;
const client_1 = require("@prisma/client");
const tsyringe_1 = require("tsyringe");
const FormacionAcademica_1 = require("../../domain/entities/FormacionAcademica");
const RedisCacheService_1 = require("../external-services/RedisCacheService");
let PrismaFormacionAcademicaRepository = class PrismaFormacionAcademicaRepository {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        this.CACHE_KEY_PREFIX = 'formaciones_academicas:';
        this.CACHE_KEY_DOCTOR_PREFIX = 'formaciones_academicas:doctor:';
        this.CACHE_TTL = 3600; // 1 hora
    }
    async crear(doctorId, universidadId, nombre, fechaInicio, estado, enCurso, fechaFinalizacion) {
        const nuevaFormacion = await this.prisma.formacionAcademica.create({
            data: {
                doctorId,
                universidadId,
                nombre,
                fecha_inicio: fechaInicio,
                fecha_finalizacion: fechaFinalizacion,
                enCurso,
                estado,
            },
            include: {
                universidad: {
                    select: {
                        nombre: true,
                        paisId: true,
                        pais: {
                            select: {
                                id: true,
                                nombre: true,
                            },
                        },
                    },
                },
            },
        });
        // Invalidar todas las claves de cache del doctor (incluyendo paginación)
        await this.redis.deleteByPattern(`${this.CACHE_KEY_DOCTOR_PREFIX}${doctorId}:*`);
        return this.mapearEntidad(nuevaFormacion);
    }
    async obtenerPorId(id) {
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
                        paisId: true,
                        pais: {
                            select: {
                                id: true,
                                nombre: true,
                            },
                        },
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
    async obtenerTodos(doctorId, estado, busqueda, pagina, limite) {
        const where = {};
        const paginaActual = pagina ?? 1;
        const limiteActual = limite ?? 10;
        if (doctorId) {
            where.doctorId = doctorId;
        }
        if (estado) {
            where.estado = estado;
        }
        if (busqueda) {
            where.OR = [
                {
                    nombre: {
                        contains: busqueda,
                        mode: 'insensitive',
                    },
                },
                {
                    universidad: {
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
                skip: (paginaActual - 1) * limiteActual,
                take: limiteActual,
                orderBy: [
                    { estado: 'asc' }, // Activo primero
                    { fecha_inicio: 'desc' }, // Más reciente primero
                ],
                include: {
                    universidad: {
                        select: {
                            nombre: true,
                            paisId: true,
                            pais: {
                                select: {
                                    id: true,
                                    nombre: true,
                                },
                            },
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
    async obtenerPorDoctor(doctorId, pagina = 1, limite = 20) {
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
                            paisId: true,
                            pais: {
                                select: {
                                    id: true,
                                    nombre: true,
                                },
                            },
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
    async actualizar(id, universidadId, nombre, fechaInicio, fechaFinalizacion, enCurso, estado) {
        // Obtener la formación actual para invalidar cache del doctor
        const formacionActual = await this.prisma.formacionAcademica.findUnique({
            where: { id },
            select: { doctorId: true },
        });
        const data = {};
        if (universidadId !== undefined) {
            data.universidadId = universidadId;
        }
        if (nombre !== undefined) {
            data.nombre = nombre;
        }
        if (fechaInicio !== undefined) {
            data.fecha_inicio = fechaInicio;
        }
        if (fechaFinalizacion !== undefined) {
            data.fecha_finalizacion = fechaFinalizacion;
        }
        if (enCurso !== undefined) {
            data.enCurso = enCurso;
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
                        paisId: true,
                        pais: {
                            select: {
                                id: true,
                                nombre: true,
                            },
                        },
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
    async eliminar(id) {
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
    async verificarDoctorExiste(doctorId) {
        const doctor = await this.prisma.doctor.findUnique({
            where: { usuarioId: doctorId },
        });
        return doctor !== null;
    }
    async verificarUniversidadExiste(universidadId) {
        const universidad = await this.prisma.universidad.findUnique({
            where: { id: universidadId },
        });
        return universidad !== null;
    }
    async verificarFormacionDuplicada(doctorId, universidadId, nombre, idExcluir) {
        const where = {
            doctorId,
            universidadId,
            nombre,
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
    mapearEntidad(data) {
        return new FormacionAcademica_1.FormacionAcademica(data.id, data.doctorId, data.universidadId, data.nombre, data.fecha_inicio, data.estado, data.creadoEn, data.fecha_finalizacion, data.enCurso ?? data.en_curso, data.actualizadoEn, 
        // Mapear objetos relacionados si existen
        data.universidad
            ? {
                nombre: data.universidad.nombre,
                paisId: data.universidad.paisId,
                pais: {
                    id: data.universidad.pais.id,
                    nombre: data.universidad.pais.nombre,
                },
            }
            : undefined);
    }
};
exports.PrismaFormacionAcademicaRepository = PrismaFormacionAcademicaRepository;
exports.PrismaFormacionAcademicaRepository = PrismaFormacionAcademicaRepository = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [client_1.PrismaClient,
        RedisCacheService_1.RedisCacheService])
], PrismaFormacionAcademicaRepository);
