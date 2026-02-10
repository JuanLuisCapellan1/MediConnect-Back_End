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
exports.PrismaExperienciasLaboralesRepository = void 0;
const client_1 = require("@prisma/client");
const tsyringe_1 = require("tsyringe");
const ExperienciaLaboral_1 = require("../../domain/entities/ExperienciaLaboral");
const RedisCacheService_1 = require("../external-services/RedisCacheService");
let PrismaExperienciasLaboralesRepository = class PrismaExperienciasLaboralesRepository {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        this.CACHE_KEY_PREFIX = 'experiencias_laborales:';
        this.CACHE_KEY_DOCTOR_PREFIX = 'experiencias_laborales:doctor:';
        this.CACHE_TTL = 3600; // 1 hora
    }
    async crear(doctorId, profesionId, descripcionCargo, fechaInicio, trabajaActualmente, estado, centroSaludId, institucionExterna, fechaFinalizacion) {
        const nuevaExperiencia = await this.prisma.experienciaLaboral.create({
            data: {
                doctorId,
                centroSaludId,
                institucionExterna,
                profesionId,
                descripcionCargo,
                fechaInicio,
                fechaFinalizacion,
                trabajaActualmente,
                estado,
            },
            include: {
                profesion: {
                    select: {
                        nombre: true,
                    },
                },
                centroSalud: {
                    select: {
                        nombreComercial: true,
                    },
                },
            },
        });
        // Invalidar todas las claves de cache del doctor (incluyendo paginación)
        await this.redis.deleteByPattern(`${this.CACHE_KEY_DOCTOR_PREFIX}${doctorId}:*`);
        return this.mapearEntidad(nuevaExperiencia);
    }
    async obtenerPorId(id) {
        const cacheKey = `${this.CACHE_KEY_PREFIX}${id}`;
        // Verificar cache
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const encontrada = await this.prisma.experienciaLaboral.findUnique({
            where: { id },
            include: {
                profesion: {
                    select: {
                        nombre: true,
                    },
                },
                centroSalud: {
                    select: {
                        nombreComercial: true,
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
    async obtenerTodos(doctorId, centroSaludId, profesionId, trabajaActualmente, estado, busqueda, pagina = 1, limite = 10) {
        const where = {};
        if (doctorId) {
            where.doctorId = doctorId;
        }
        if (centroSaludId) {
            where.centroSaludId = centroSaludId;
        }
        if (profesionId) {
            where.profesionId = profesionId;
        }
        if (trabajaActualmente !== undefined) {
            where.trabajaActualmente = trabajaActualmente;
        }
        if (estado) {
            where.estado = estado;
        }
        if (busqueda) {
            where.OR = [
                {
                    descripcionCargo: {
                        contains: busqueda,
                        mode: 'insensitive',
                    },
                },
                {
                    institucionExterna: {
                        contains: busqueda,
                        mode: 'insensitive',
                    },
                },
            ];
        }
        const [experiencias, total] = await Promise.all([
            this.prisma.experienciaLaboral.findMany({
                where,
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: [
                    { trabajaActualmente: 'desc' }, // Primero los trabajos actuales
                    { fechaInicio: 'desc' }, // Luego ordenar por fecha de inicio (más reciente primero)
                ],
                include: {
                    profesion: {
                        select: {
                            nombre: true,
                        },
                    },
                    centroSalud: {
                        select: {
                            nombreComercial: true,
                        },
                    },
                },
            }),
            this.prisma.experienciaLaboral.count({ where }),
        ]);
        return {
            experiencias: experiencias.map(this.mapearEntidad),
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
            estado: 'Activo', // Solo experiencias activas
        };
        const [experiencias, total] = await Promise.all([
            this.prisma.experienciaLaboral.findMany({
                where,
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: [
                    { trabajaActualmente: 'desc' }, // Primero los trabajos actuales
                    { fechaInicio: 'desc' }, // Luego ordenar por fecha de inicio
                ],
                include: {
                    profesion: {
                        select: {
                            nombre: true,
                        },
                    },
                    centroSalud: {
                        select: {
                            nombreComercial: true,
                        },
                    },
                },
            }),
            this.prisma.experienciaLaboral.count({ where }),
        ]);
        const resultado = {
            experiencias: experiencias.map(this.mapearEntidad),
            total,
        };
        // Guardar en cache si es consulta por defecto
        if (esConsultaPorDefecto) {
            await this.redis.set(cacheKey, JSON.stringify(resultado), this.CACHE_TTL);
        }
        return resultado;
    }
    async actualizar(id, centroSaludId, institucionExterna, profesionId, descripcionCargo, fechaInicio, fechaFinalizacion, trabajaActualmente, estado) {
        // Obtener la experiencia actual para invalidar cache del doctor
        const experienciaActual = await this.prisma.experienciaLaboral.findUnique({
            where: { id },
            select: { doctorId: true },
        });
        const data = {};
        if (centroSaludId !== undefined) {
            data.centroSaludId = centroSaludId;
        }
        if (institucionExterna !== undefined) {
            data.institucionExterna = institucionExterna;
        }
        if (profesionId !== undefined) {
            data.profesionId = profesionId;
        }
        if (descripcionCargo !== undefined) {
            data.descripcionCargo = descripcionCargo;
        }
        if (fechaInicio !== undefined) {
            data.fechaInicio = fechaInicio;
        }
        if (fechaFinalizacion !== undefined) {
            data.fechaFinalizacion = fechaFinalizacion;
        }
        if (trabajaActualmente !== undefined) {
            data.trabajaActualmente = trabajaActualmente;
        }
        if (estado !== undefined) {
            data.estado = estado;
        }
        data.actualizadoEn = new Date();
        const actualizada = await this.prisma.experienciaLaboral.update({
            where: { id },
            data,
            include: {
                doctor: {
                    select: {
                        nombre: true,
                        apellido: true,
                    },
                },
                profesion: {
                    select: {
                        nombre: true,
                    },
                },
                centroSalud: {
                    select: {
                        nombreComercial: true,
                    },
                },
            },
        });
        // Invalidar caches
        await this.redis.del(`${this.CACHE_KEY_PREFIX}${id}`);
        if (experienciaActual) {
            await this.redis.deleteByPattern(`${this.CACHE_KEY_DOCTOR_PREFIX}${experienciaActual.doctorId}:*`);
        }
        return this.mapearEntidad(actualizada);
    }
    async eliminar(id) {
        // Obtener la experiencia para invalidar cache del doctor
        const experiencia = await this.prisma.experienciaLaboral.findUnique({
            where: { id },
            select: { doctorId: true },
        });
        // Soft delete: actualizar estado a "Eliminado"
        await this.prisma.experienciaLaboral.update({
            where: { id },
            data: {
                estado: 'Eliminado',
                actualizadoEn: new Date(),
            },
        });
        // Invalidar caches
        await this.redis.del(`${this.CACHE_KEY_PREFIX}${id}`);
        if (experiencia) {
            await this.redis.deleteByPattern(`${this.CACHE_KEY_DOCTOR_PREFIX}${experiencia.doctorId}:*`);
        }
    }
    async verificarDoctorExiste(doctorId) {
        const doctor = await this.prisma.doctor.findUnique({
            where: { usuarioId: doctorId },
        });
        return doctor !== null;
    }
    async verificarCentroSaludExiste(centroSaludId) {
        const centroSalud = await this.prisma.centroSalud.findUnique({
            where: { usuarioId: centroSaludId },
        });
        return centroSalud !== null;
    }
    async verificarProfesionExiste(profesionId) {
        const profesion = await this.prisma.profesion.findUnique({
            where: { id: profesionId },
        });
        return profesion !== null;
    }
    mapearEntidad(data) {
        return new ExperienciaLaboral_1.ExperienciaLaboral(data.id, data.doctorId, data.profesionId, data.descripcionCargo, data.fechaInicio, data.trabajaActualmente, data.estado, data.creadoEn, data.centroSaludId, data.institucionExterna, data.fechaFinalizacion, data.actualizadoEn, 
        // Mapear objetos relacionados si existen
        data.profesion ? { nombre: data.profesion.nombre } : undefined, data.centroSalud ? { nombreComercial: data.centroSalud.nombreComercial } : undefined);
    }
};
exports.PrismaExperienciasLaboralesRepository = PrismaExperienciasLaboralesRepository;
exports.PrismaExperienciasLaboralesRepository = PrismaExperienciasLaboralesRepository = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [client_1.PrismaClient,
        RedisCacheService_1.RedisCacheService])
], PrismaExperienciasLaboralesRepository);
