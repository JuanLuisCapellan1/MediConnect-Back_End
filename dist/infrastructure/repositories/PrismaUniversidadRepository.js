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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaUniversidadRepository = void 0;
const client_1 = require("@prisma/client");
const tsyringe_1 = require("tsyringe");
const Universidad_1 = require("../../domain/entities/Universidad");
const RedisCacheService_1 = require("../external-services/RedisCacheService");
let PrismaUniversidadRepository = class PrismaUniversidadRepository {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        this.CACHE_KEY_LIST = 'universidades:listado';
        this.CACHE_KEY_PREFIX = 'universidades:';
        this.CACHE_KEY_POR_PAIS = 'universidades:pais:';
    }
    async crear(universidad) {
        const nuevaUniversidad = await this.prisma.universidad.create({
            data: {
                paisId: universidad.paisId,
                nombre: universidad.nombre,
                estado: universidad.estado,
            },
            include: {
                pais: {
                    select: {
                        id: true,
                        nombre: true,
                    },
                },
            },
        });
        // Invalidar caché de listado y por país
        await this.redis.del(this.CACHE_KEY_LIST);
        await this.redis.del(`${this.CACHE_KEY_POR_PAIS}${universidad.paisId}`);
        return new Universidad_1.Universidad(nuevaUniversidad);
    }
    async obtenerPorId(id) {
        // Intentar obtener de caché
        const cacheKey = `${this.CACHE_KEY_PREFIX}${id}`;
        const cached = await this.redis.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const universidad = await this.prisma.universidad.findUnique({
            where: { id },
            include: {
                pais: {
                    select: {
                        id: true,
                        nombre: true,
                    },
                },
                formaciones: {
                    where: { estado: 'Activo' },
                },
            },
        });
        if (universidad) {
            const entidad = new Universidad_1.Universidad(universidad);
            // Guardar en caché (TTL 1 hora)
            await this.redis.set(cacheKey, JSON.stringify(entidad), 3600);
            return entidad;
        }
        return null;
    }
    async obtenerTodos(paisId, estado, busqueda, pagina = 1, limite = 10) {
        // Si no hay filtros específicos, intentar obtener de caché
        if (!paisId && !estado && !busqueda && pagina === 1 && limite === 10) {
            const cached = await this.redis.get(this.CACHE_KEY_LIST);
            if (cached)
                return JSON.parse(cached);
        }
        const where = {};
        if (paisId) {
            where.paisId = paisId;
        }
        if (estado) {
            where.estado = estado;
        }
        if (busqueda) {
            where.nombre = {
                contains: busqueda,
                mode: 'insensitive',
            };
        }
        const [universidades, total] = await Promise.all([
            this.prisma.universidad.findMany({
                where,
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: { nombre: 'asc' },
                include: {
                    pais: {
                        select: {
                            id: true,
                            nombre: true,
                        },
                    },
                },
            }),
            this.prisma.universidad.count({ where }),
        ]);
        const resultado = {
            universidades: universidades.map(u => new Universidad_1.Universidad(u)),
            total,
        };
        // Guardar en caché solo si es la consulta por defecto
        if (!paisId && !estado && !busqueda && pagina === 1 && limite === 10) {
            await this.redis.set(this.CACHE_KEY_LIST, JSON.stringify(resultado), 3600);
        }
        return resultado;
    }
    async obtenerPorPais(paisId) {
        // Intentar obtener de caché
        const cacheKey = `${this.CACHE_KEY_POR_PAIS}${paisId}`;
        const cached = await this.redis.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const universidades = await this.prisma.universidad.findMany({
            where: {
                paisId,
                estado: 'Activo',
            },
            orderBy: { nombre: 'asc' },
            include: {
                pais: {
                    select: {
                        id: true,
                        nombre: true,
                    },
                },
            },
        });
        const resultado = universidades.map(u => new Universidad_1.Universidad(u));
        // Guardar en caché (TTL 1 hora)
        await this.redis.set(cacheKey, JSON.stringify(resultado), 3600);
        return resultado;
    }
    async actualizar(id, universidad) {
        // Obtener la universidad actual para invalidar caché de país
        const universidadActual = await this.prisma.universidad.findUnique({
            where: { id },
        });
        const universidadActualizada = await this.prisma.universidad.update({
            where: { id },
            data: {
                nombre: universidad.nombre,
                paisId: universidad.paisId,
                estado: universidad.estado,
            },
            include: {
                pais: {
                    select: {
                        id: true,
                        nombre: true,
                    },
                },
            },
        });
        // Invalidar caché del registro y caché de país (tanto anterior como nuevo)
        await this.redis.del(`${this.CACHE_KEY_PREFIX}${id}`);
        await this.redis.del(this.CACHE_KEY_LIST);
        if (universidadActual) {
            await this.redis.del(`${this.CACHE_KEY_POR_PAIS}${universidadActual.paisId}`);
        }
        await this.redis.del(`${this.CACHE_KEY_POR_PAIS}${universidad.paisId}`);
        return new Universidad_1.Universidad(universidadActualizada);
    }
    async eliminar(id) {
        // Obtener la universidad actual para invalidar caché de país
        const universidad = await this.prisma.universidad.findUnique({
            where: { id },
        });
        await this.prisma.universidad.update({
            where: { id },
            data: { estado: 'Inactivo' },
        });
        // Invalidar caché del registro y del país
        await this.redis.del(`${this.CACHE_KEY_PREFIX}${id}`);
        await this.redis.del(this.CACHE_KEY_LIST);
        if (universidad) {
            await this.redis.del(`${this.CACHE_KEY_POR_PAIS}${universidad.paisId}`);
        }
    }
};
exports.PrismaUniversidadRepository = PrismaUniversidadRepository;
exports.PrismaUniversidadRepository = PrismaUniversidadRepository = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(1, (0, tsyringe_1.inject)(RedisCacheService_1.RedisCacheService)),
    __metadata("design:paramtypes", [client_1.PrismaClient,
        RedisCacheService_1.RedisCacheService])
], PrismaUniversidadRepository);
