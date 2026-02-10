"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaTipoCentroSaludRepository = void 0;
const TipoCentroSalud_1 = require("../../domain/entities/TipoCentroSalud");
class PrismaTipoCentroSaludRepository {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        this.CACHE_KEY_LIST = 'tiposCentrosSalud:listado';
        this.CACHE_KEY_PREFIX = 'tiposCentrosSalud:';
    }
    mapearEntidad(data) {
        return new TipoCentroSalud_1.TipoCentroSalud({
            id: data.id,
            nombre: data.nombre,
            estado: data.estado,
            creadoEn: data.creadoEn,
        });
    }
    async crear(datos) {
        const nuevo = await this.prisma.tipoCentroSalud.create({
            data: {
                nombre: datos.nombre,
                estado: datos.estado || 'Activo',
            },
        });
        // Invalidar caché de listado
        await this.redis.del(this.CACHE_KEY_LIST);
        return this.mapearEntidad(nuevo);
    }
    async obtenerPorId(id) {
        // Intentar obtener de caché
        const cacheKey = `${this.CACHE_KEY_PREFIX}${id}`;
        const cached = await this.redis.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const encontrado = await this.prisma.tipoCentroSalud.findUnique({
            where: { id },
        });
        if (encontrado) {
            const entidad = this.mapearEntidad(encontrado);
            // Guardar en caché (TTL 1 hora)
            await this.redis.set(cacheKey, JSON.stringify(entidad), 3600);
            return entidad;
        }
        return null;
    }
    async obtenerTodos(filtros) {
        const pagina = filtros.pagina || 1;
        const limite = filtros.limite || 10;
        const skip = (pagina - 1) * limite;
        // Si no hay filtros específicos, intentar obtener de caché
        if (!filtros.nombre && !filtros.estado && pagina === 1 && limite === 10) {
            const cached = await this.redis.get(this.CACHE_KEY_LIST);
            if (cached)
                return JSON.parse(cached);
        }
        const where = {};
        if (filtros.nombre) {
            where.nombre = { contains: filtros.nombre, mode: 'insensitive' };
        }
        if (filtros.estado) {
            where.estado = filtros.estado;
        }
        else {
            where.estado = { not: 'Eliminado' };
        }
        const [datos, total] = await Promise.all([
            this.prisma.tipoCentroSalud.findMany({
                where,
                skip,
                take: limite,
                orderBy: { nombre: 'asc' },
            }),
            this.prisma.tipoCentroSalud.count({ where }),
        ]);
        const resultado = {
            datos: datos.map((d) => this.mapearEntidad(d)),
            total,
        };
        // Guardar en caché solo si es la consulta por defecto
        if (!filtros.nombre && !filtros.estado && pagina === 1 && limite === 10) {
            await this.redis.set(this.CACHE_KEY_LIST, JSON.stringify(resultado), 3600);
        }
        return resultado;
    }
    async actualizar(id, datos) {
        const actualizado = await this.prisma.tipoCentroSalud.update({
            where: { id },
            data: {
                ...datos,
            },
        });
        // Invalidar caché del registro específico y del listado
        await this.redis.del(`${this.CACHE_KEY_PREFIX}${id}`);
        await this.redis.del(this.CACHE_KEY_LIST);
        return this.mapearEntidad(actualizado);
    }
    async eliminar(id) {
        await this.prisma.tipoCentroSalud.update({
            where: { id },
            data: { estado: 'Eliminado' },
        });
        // Invalidar caché del registro específico y del listado
        await this.redis.del(`${this.CACHE_KEY_PREFIX}${id}`);
        await this.redis.del(this.CACHE_KEY_LIST);
    }
    async existeNombre(nombre, excluirId) {
        const where = {
            nombre: { equals: nombre, mode: 'insensitive' },
            estado: { not: 'Eliminado' },
        };
        if (excluirId) {
            where.id = { not: excluirId };
        }
        const count = await this.prisma.tipoCentroSalud.count({ where });
        return count > 0;
    }
}
exports.PrismaTipoCentroSaludRepository = PrismaTipoCentroSaludRepository;
