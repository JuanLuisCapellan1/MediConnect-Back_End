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
exports.PrismaExperienciaLaboralRepository = void 0;
const client_1 = require("@prisma/client");
const tsyringe_1 = require("tsyringe");
const ExperienciaLaboral_1 = require("../../domain/entities/ExperienciaLaboral");
const RedisCacheService_1 = require("../external-services/RedisCacheService");
let PrismaExperienciaLaboralRepository = class PrismaExperienciaLaboralRepository {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        this.CACHE_KEY_PREFIX = 'experiencias_laborales:';
        this.CACHE_KEY_DOCTOR_PREFIX = 'experiencias_laborales:doctor:';
        this.CACHE_TTL = 3600; // 1 hora
    }
    async crear(experiencia) {
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
    async obtenerPorId(id) {
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
    async obtenerTodos(doctorId, estado, busqueda, pagina = 1, limite = 10) {
        const cacheKey = `${this.CACHE_KEY_DOCTOR_PREFIX}${doctorId}:${estado || 'all'}:${busqueda || 'all'}:${pagina}:${limite}`;
        // Verificar cache
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const where = {};
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
    async actualizar(id, datos) {
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
    async eliminar(id) {
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
    async verificarDoctorExiste(doctorId) {
        const doctor = await this.prisma.doctor.findUnique({
            where: { usuarioId: doctorId },
        });
        return doctor !== null;
    }
    mapearEntidad(data) {
        return new ExperienciaLaboral_1.ExperienciaLaboral(data.id, data.doctorId, data.institucion, data.posicion, data.fechaInicio, data.estado, data.creadoEn, data.fechaFinalizacion, data.trabajaActualmente, data.actualizadoEn);
    }
};
exports.PrismaExperienciaLaboralRepository = PrismaExperienciaLaboralRepository;
exports.PrismaExperienciaLaboralRepository = PrismaExperienciaLaboralRepository = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [client_1.PrismaClient,
        RedisCacheService_1.RedisCacheService])
], PrismaExperienciaLaboralRepository);
