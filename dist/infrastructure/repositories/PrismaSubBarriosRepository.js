"use strict";
/**
 * PrismaSubBarriosRepository.ts
 * Implementación del repositorio para SubBarrios usando Prisma ORM y Redis para caching
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaSubBarriosRepository = void 0;
const client_1 = require("@prisma/client");
const RedisCacheService_1 = require("../external-services/RedisCacheService");
const SubBarrio_1 = require("../../domain/entities/SubBarrio");
const tsyringe_1 = require("tsyringe");
let PrismaSubBarriosRepository = class PrismaSubBarriosRepository {
    constructor(prisma, cache) {
        this.prisma = prisma;
        this.cache = cache;
        this.CACHE_KEY = 'subBarrios:listado';
        this.CACHE_KEY_POR_BARRIO = (barrioId) => `subBarrios:barrio:${barrioId}`;
        this.CACHE_TTL = 24 * 60 * 60; // 24 horas en segundos
    }
    /**
     * Crea un nuevo SubBarrio
     */
    async crear(barrioId, nombre) {
        const subBarrio = await this.prisma.subBarrio.create({
            data: {
                barrioId,
                nombre: nombre.trim(),
                estado: 'Activo',
            },
        });
        // Invalidar caché
        await this.invalidarCache(barrioId);
        return new SubBarrio_1.SubBarrio(subBarrio.id, subBarrio.barrioId, subBarrio.nombre, subBarrio.estado, subBarrio.creadoEn);
    }
    /**
     * Lista todos los SubBarrios
     */
    async listarTodos() {
        // Intentar obtener del caché
        const cached = await this.cache.get(this.CACHE_KEY);
        if (cached) {
            return JSON.parse(cached).map((sb) => new SubBarrio_1.SubBarrio(sb.id, sb.barrioId, sb.nombre, sb.estado, new Date(sb.creadoEn)));
        }
        // Si no está en caché, obtener de la BD
        const subBarrios = await this.prisma.subBarrio.findMany({
            where: { estado: { not: 'Eliminado' } },
            orderBy: { id: 'asc' },
        });
        // Guardar en caché
        await this.cache.set(this.CACHE_KEY, JSON.stringify(subBarrios), this.CACHE_TTL);
        return subBarrios.map(sb => new SubBarrio_1.SubBarrio(sb.id, sb.barrioId, sb.nombre, sb.estado, sb.creadoEn));
    }
    /**
     * Lista todos los SubBarrios de un barrio específico
     */
    async listarPorBarrio(barrioId) {
        const cacheKey = this.CACHE_KEY_POR_BARRIO(barrioId);
        // Intentar obtener del caché
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return JSON.parse(cached).map((sb) => new SubBarrio_1.SubBarrio(sb.id, sb.barrioId, sb.nombre, sb.estado, new Date(sb.creadoEn)));
        }
        // Si no está en caché, obtener de la BD
        const subBarrios = await this.prisma.subBarrio.findMany({
            where: {
                barrioId,
                estado: { not: 'Eliminado' },
            },
            orderBy: { id: 'asc' },
        });
        // Guardar en caché
        await this.cache.set(cacheKey, JSON.stringify(subBarrios), this.CACHE_TTL);
        return subBarrios.map(sb => new SubBarrio_1.SubBarrio(sb.id, sb.barrioId, sb.nombre, sb.estado, sb.creadoEn));
    }
    /**
     * Busca un SubBarrio por ID
     */
    async buscarPorId(id) {
        const subBarrio = await this.prisma.subBarrio.findUnique({
            where: { id },
        });
        if (!subBarrio || subBarrio.estado === 'Eliminado') {
            return null;
        }
        return new SubBarrio_1.SubBarrio(subBarrio.id, subBarrio.barrioId, subBarrio.nombre, subBarrio.estado, subBarrio.creadoEn);
    }
    /**
     * Busca SubBarrios por nombre
     */
    async buscarPorNombre(nombre) {
        const subBarrios = await this.prisma.subBarrio.findMany({
            where: {
                nombre: { contains: nombre, mode: 'insensitive' },
                estado: { not: 'Eliminado' },
            },
        });
        return subBarrios.map(sb => new SubBarrio_1.SubBarrio(sb.id, sb.barrioId, sb.nombre, sb.estado, sb.creadoEn));
    }
    /**
     * Busca SubBarrios por estado
     */
    async buscarPorEstado(estado) {
        const subBarrios = await this.prisma.subBarrio.findMany({
            where: {
                estado,
            },
        });
        return subBarrios.map(sb => new SubBarrio_1.SubBarrio(sb.id, sb.barrioId, sb.nombre, sb.estado, sb.creadoEn));
    }
    /**
     * Actualiza un SubBarrio existente
     */
    async actualizar(id, barrioId, nombre, estado) {
        const subBarrio = await this.prisma.subBarrio.findUnique({ where: { id } });
        if (!subBarrio) {
            throw new Error(`SubBarrio con ID ${id} no existe`);
        }
        const datosActualizacion = {};
        if (nombre !== undefined)
            datosActualizacion.nombre = nombre.trim();
        if (estado !== undefined)
            datosActualizacion.estado = estado;
        if (barrioId !== undefined)
            datosActualizacion.barrioId = barrioId;
        const subBarrioActualizado = await this.prisma.subBarrio.update({
            where: { id },
            data: datosActualizacion,
        });
        // Invalidar caché del barrio anterior y nuevo
        const barrioAnterior = subBarrio.barrioId;
        const barrioNuevo = barrioId !== undefined ? barrioId : subBarrio.barrioId;
        await this.invalidarCache(barrioAnterior);
        if (barrioNuevo !== barrioAnterior) {
            await this.invalidarCache(barrioNuevo);
        }
        return new SubBarrio_1.SubBarrio(subBarrioActualizado.id, subBarrioActualizado.barrioId, subBarrioActualizado.nombre, subBarrioActualizado.estado, subBarrioActualizado.creadoEn);
    }
    /**
     * Elimina un SubBarrio (eliminación lógica)
     */
    async eliminar(id) {
        const subBarrio = await this.prisma.subBarrio.findUnique({ where: { id } });
        if (!subBarrio) {
            throw new Error(`SubBarrio con ID ${id} no existe`);
        }
        // Verificar que no haya ubicaciones asociadas
        const ubicacionesAsociadas = await this.prisma.ubicacion.count({
            where: { subBarrioId: id },
        });
        if (ubicacionesAsociadas > 0) {
            throw new Error(`No se puede eliminar el SubBarrio porque tiene ${ubicacionesAsociadas} ubicaciones asociadas`);
        }
        // Eliminación lógica
        const subBarrioEliminado = await this.prisma.subBarrio.update({
            where: { id },
            data: { estado: 'Eliminado' },
        });
        // Invalidar caché
        await this.invalidarCache(subBarrio.barrioId);
        return new SubBarrio_1.SubBarrio(subBarrioEliminado.id, subBarrioEliminado.barrioId, subBarrioEliminado.nombre, subBarrioEliminado.estado, subBarrioEliminado.creadoEn);
    }
    /**
     * Invalida todas las claves de caché relacionadas con SubBarrios
     */
    async invalidarCache(barrioId) {
        await Promise.all([
            this.cache.del(this.CACHE_KEY),
            this.cache.del(this.CACHE_KEY_POR_BARRIO(barrioId)),
        ]);
    }
};
exports.PrismaSubBarriosRepository = PrismaSubBarriosRepository;
exports.PrismaSubBarriosRepository = PrismaSubBarriosRepository = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('PrismaClient')),
    __param(1, (0, tsyringe_1.inject)('RedisCacheService')),
    __metadata("design:paramtypes", [client_1.PrismaClient,
        RedisCacheService_1.RedisCacheService])
], PrismaSubBarriosRepository);
