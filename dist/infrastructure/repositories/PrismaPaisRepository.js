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
exports.PrismaPaisRepository = void 0;
const client_1 = require("@prisma/client");
const tsyringe_1 = require("tsyringe");
const Pais_1 = require("../../domain/entities/Pais");
const RedisCacheService_1 = require("../external-services/RedisCacheService");
let PrismaPaisRepository = class PrismaPaisRepository {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        this.CACHE_KEY_LIST = 'paises:listado';
        this.CACHE_KEY_PREFIX = 'paises:';
    }
    async crear(pais) {
        const nuevoPais = await this.prisma.pais.create({
            data: {
                nombre: pais.nombre,
                codigo_iso: pais.codigo_iso,
                estado: pais.estado,
            },
        });
        // Invalidar caché de listado
        await this.redis.del(this.CACHE_KEY_LIST);
        return new Pais_1.Pais(nuevoPais);
    }
    async obtenerPorId(id) {
        // Intentar obtener de caché
        const cacheKey = `${this.CACHE_KEY_PREFIX}${id}`;
        const cached = await this.redis.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const pais = await this.prisma.pais.findUnique({
            where: { id },
            include: {
                universidades: {
                    where: { estado: 'Activo' },
                },
            },
        });
        if (pais) {
            const entidad = new Pais_1.Pais(pais);
            // Guardar en caché (TTL 1 hora)
            await this.redis.set(cacheKey, JSON.stringify(entidad), 3600);
            return entidad;
        }
        return null;
    }
    async obtenerTodos(estado, busqueda, pagina = 1, limite = 10) {
        // Si no hay filtros específicos, intentar obtener de caché
        if (!estado && !busqueda && pagina === 1 && limite === 10) {
            const cached = await this.redis.get(this.CACHE_KEY_LIST);
            if (cached)
                return JSON.parse(cached);
        }
        const where = {};
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
                    codigo_iso: {
                        contains: busqueda,
                        mode: 'insensitive',
                    },
                },
            ];
        }
        const [paises, total] = await Promise.all([
            this.prisma.pais.findMany({
                where,
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: { nombre: 'asc' },
                include: {
                    universidades: {
                        where: { estado: 'Activo' },
                    },
                },
            }),
            this.prisma.pais.count({ where }),
        ]);
        const resultado = {
            paises: paises.map(p => new Pais_1.Pais(p)),
            total,
        };
        // Guardar en caché solo si es la consulta por defecto
        if (!estado && !busqueda && pagina === 1 && limite === 10) {
            await this.redis.set(this.CACHE_KEY_LIST, JSON.stringify(resultado), 3600);
        }
        return resultado;
    }
    async actualizar(id, pais) {
        const paisActualizado = await this.prisma.pais.update({
            where: { id },
            data: {
                nombre: pais.nombre,
                codigo_iso: pais.codigo_iso,
                estado: pais.estado,
            },
            include: {
                universidades: {
                    where: { estado: 'Activo' },
                },
            },
        });
        // Invalidar caché del registro específico y del listado
        await this.redis.del(`${this.CACHE_KEY_PREFIX}${id}`);
        await this.redis.del(this.CACHE_KEY_LIST);
        return new Pais_1.Pais(paisActualizado);
    }
    async eliminar(id) {
        await this.prisma.pais.update({
            where: { id },
            data: { estado: 'Inactivo' },
        });
        // Invalidar caché del registro específico y del listado
        await this.redis.del(`${this.CACHE_KEY_PREFIX}${id}`);
        await this.redis.del(this.CACHE_KEY_LIST);
    }
};
exports.PrismaPaisRepository = PrismaPaisRepository;
exports.PrismaPaisRepository = PrismaPaisRepository = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(1, (0, tsyringe_1.inject)(RedisCacheService_1.RedisCacheService)),
    __metadata("design:paramtypes", [client_1.PrismaClient,
        RedisCacheService_1.RedisCacheService])
], PrismaPaisRepository);
