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
exports.PrismaProfesionesRepository = void 0;
const client_1 = require("@prisma/client");
const tsyringe_1 = require("tsyringe");
const Profesion_1 = require("../../domain/entities/Profesion");
const RedisCacheService_1 = require("../external-services/RedisCacheService");
let PrismaProfesionesRepository = class PrismaProfesionesRepository {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        this.CACHE_KEY_LIST = 'profesiones:listado';
        this.CACHE_KEY_PREFIX = 'profesiones:';
    }
    async crear(nombre, estado, descripcion) {
        const nuevaProfesion = await this.prisma.profesion.create({
            data: {
                nombre,
                estado,
                descripcion,
            },
        });
        // Invalidar cache de listado
        await this.redis.del(this.CACHE_KEY_LIST);
        return this.mapearEntidad(nuevaProfesion);
    }
    async obtenerPorId(id) {
        const cacheKey = `${this.CACHE_KEY_PREFIX}${id}`;
        // Verificar cache
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const encontrada = await this.prisma.profesion.findUnique({
            where: { id },
        });
        if (!encontrada) {
            return null;
        }
        const entidad = this.mapearEntidad(encontrada);
        // Guardar en cache por 1 hora
        await this.redis.set(cacheKey, JSON.stringify(entidad), 3600);
        return entidad;
    }
    async obtenerTodos(estado, busqueda, pagina = 1, limite = 10) {
        // Solo cachear consultas por defecto (sin filtros, página 1, límite 10)
        const esConsultaPorDefecto = !estado && !busqueda && pagina === 1 && limite === 10;
        if (esConsultaPorDefecto) {
            const cached = await this.redis.get(this.CACHE_KEY_LIST);
            if (cached) {
                return JSON.parse(cached);
            }
        }
        const where = {};
        if (estado) {
            where.estado = estado;
        }
        if (busqueda) {
            where.nombre = {
                contains: busqueda,
                mode: 'insensitive',
            };
        }
        const [profesiones, total] = await Promise.all([
            this.prisma.profesion.findMany({
                where,
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: { creadoEn: 'desc' },
            }),
            this.prisma.profesion.count({ where }),
        ]);
        const resultado = {
            profesiones: profesiones.map(this.mapearEntidad),
            total,
        };
        // Guardar en cache solo si es consulta por defecto
        if (esConsultaPorDefecto) {
            await this.redis.set(this.CACHE_KEY_LIST, JSON.stringify(resultado), 3600);
        }
        return resultado;
    }
    async actualizar(id, nombre, estado, descripcion) {
        const data = {};
        if (nombre !== undefined) {
            data.nombre = nombre;
        }
        if (estado !== undefined) {
            data.estado = estado;
        }
        if (descripcion !== undefined) {
            data.descripcion = descripcion;
        }
        const actualizada = await this.prisma.profesion.update({
            where: { id },
            data,
        });
        // Invalidar cache
        await this.redis.del(`${this.CACHE_KEY_PREFIX}${id}`);
        await this.redis.del(this.CACHE_KEY_LIST);
        return this.mapearEntidad(actualizada);
    }
    async eliminar(id) {
        // Soft delete
        await this.prisma.profesion.update({
            where: { id },
            data: { estado: 'Eliminado' },
        });
        // Invalidar cache
        await this.redis.del(`${this.CACHE_KEY_PREFIX}${id}`);
        await this.redis.del(this.CACHE_KEY_LIST);
    }
    async existePorNombre(nombre, excluyendoId) {
        const where = {
            nombre: {
                equals: nombre,
                mode: 'insensitive',
            },
            estado: {
                not: 'Eliminado',
            },
        };
        if (excluyendoId) {
            where.id = { not: excluyendoId };
        }
        const count = await this.prisma.profesion.count({ where });
        return count > 0;
    }
    mapearEntidad(profesion) {
        return new Profesion_1.Profesion(profesion.id, profesion.nombre, profesion.estado, profesion.creadoEn, profesion.descripcion);
    }
};
exports.PrismaProfesionesRepository = PrismaProfesionesRepository;
exports.PrismaProfesionesRepository = PrismaProfesionesRepository = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [client_1.PrismaClient,
        RedisCacheService_1.RedisCacheService])
], PrismaProfesionesRepository);
