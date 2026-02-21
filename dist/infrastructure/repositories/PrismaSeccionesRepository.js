"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaSeccionesRepository = void 0;
const Seccion_1 = require("../../domain/entities/Seccion");
class PrismaSeccionesRepository {
    constructor(prisma, redis) {
        this.CACHE_KEY = 'secciones:listado';
        this.CACHE_TTL = 86400; // 24 horas
        this.CACHE_KEY_POR_DISTRITO = (distritoMunicipalId) => `secciones:distrito:${distritoMunicipalId}`;
        this.prisma = prisma;
        this.redis = redis;
    }
    async obtenerTodas(estado) {
        const cacheKey = estado ? `${this.CACHE_KEY}:${estado}` : this.CACHE_KEY;
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const secciones = await this.prisma.seccion.findMany({
            where: estado ? { estado } : undefined,
            orderBy: { nombre: 'asc' }
        });
        const mapped = secciones.map((s) => new Seccion_1.Seccion(s.id, s.distritoMunicipalId, s.nombre, s.estado, s.creadoEn));
        await this.redis.set(cacheKey, JSON.stringify(mapped), this.CACHE_TTL);
        return mapped;
    }
    async obtenerPorId(id) {
        const seccion = await this.prisma.seccion.findUnique({
            where: { id }
        });
        if (!seccion) {
            return null;
        }
        return new Seccion_1.Seccion(seccion.id, seccion.distritoMunicipalId, seccion.nombre, seccion.estado, seccion.creadoEn);
    }
    async obtenerPorDistrito(distritoMunicipalId, estado) {
        const cacheKey = estado
            ? `${this.CACHE_KEY_POR_DISTRITO(distritoMunicipalId)}:${estado}`
            : this.CACHE_KEY_POR_DISTRITO(distritoMunicipalId);
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const secciones = await this.prisma.seccion.findMany({
            where: {
                distritoMunicipalId,
                ...(estado && { estado })
            },
            orderBy: { nombre: 'asc' }
        });
        const mapped = secciones.map((s) => new Seccion_1.Seccion(s.id, s.distritoMunicipalId, s.nombre, s.estado, s.creadoEn));
        await this.redis.set(cacheKey, JSON.stringify(mapped), this.CACHE_TTL);
        return mapped;
    }
    async obtenerPorMunicipio(municipioId, estado) {
        const cacheKey = estado
            ? `secciones:municipio:${municipioId}:${estado}`
            : `secciones:municipio:${municipioId}`;
        const cached = await this.redis.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        // Las secciones se vinculan a municipio a través de DistritoMunicipal,
        // pero también pueden existir secciones SIN distrito asignado.
        // Esta query obtiene todas: las que tienen distrito del municipio dado
        // y las que no tienen distrito (distritoMunicipalId IS NULL) pero pertenecen al municipio
        // vía la relación inversa. Por simplicidad y para cubrir el caso de secciones sin distrito,
        // filtramos directamente por el municipioId del distrito cuando existe.
        const secciones = await this.prisma.seccion.findMany({
            where: {
                OR: [
                    {
                        distritoMunicipal: {
                            municipioId
                        }
                    },
                    // Secciones sin distrito cuyo municipioId se guarda directamente (si aplica)
                    // Si el schema no tiene municipioId directo, este OR solo aplica el primero
                ],
                ...(estado && { estado })
            },
            orderBy: { nombre: 'asc' }
        });
        const mapped = secciones.map((s) => new Seccion_1.Seccion(s.id, s.distritoMunicipalId, s.nombre, s.estado, s.creadoEn));
        await this.redis.set(cacheKey, JSON.stringify(mapped), this.CACHE_TTL);
        return mapped;
    }
    async buscarPorNombre(nombre, distritoMunicipalId, estado) {
        const seccion = await this.prisma.seccion.findMany({
            where: {
                nombre: {
                    contains: nombre,
                    mode: 'insensitive'
                },
                ...(distritoMunicipalId && { distritoMunicipalId }),
                ...(estado && { estado })
            }
        });
        if (!seccion) {
            return [];
        }
        return seccion.map((s) => new Seccion_1.Seccion(s.id, s.distritoMunicipalId, s.nombre, s.estado, s.creadoEn));
    }
    async buscarPorNombreSensitive(nombre, distritoMunicipalId, estado) {
        const seccion = await this.prisma.seccion.findMany({
            where: {
                nombre: {
                    equals: nombre
                },
                ...(distritoMunicipalId && { distritoMunicipalId }),
                ...(estado && { estado })
            }
        });
        if (!seccion) {
            return [];
        }
        return seccion.map((s) => new Seccion_1.Seccion(s.id, s.distritoMunicipalId, s.nombre, s.estado, s.creadoEn));
    }
    async crear(seccion) {
        const createData = {
            nombre: seccion.nombre,
            estado: seccion.estado
        };
        if (seccion.distritoMunicipalId !== null) {
            createData.distritoMunicipalId = seccion.distritoMunicipalId;
        }
        const nueva = await this.prisma.seccion.create({
            data: createData
        });
        // Invalidar cachés
        if (nueva.distritoMunicipalId) {
            await this.invalidarCaches(nueva.distritoMunicipalId);
        }
        await this.redis.del(this.CACHE_KEY);
        await this.redis.del(`${this.CACHE_KEY}:Activo`);
        await this.redis.del(`${this.CACHE_KEY}:Inactivo`);
        return new Seccion_1.Seccion(nueva.id, nueva.distritoMunicipalId, nueva.nombre, nueva.estado, nueva.creadoEn);
    }
    async actualizar(id, datos) {
        const seccionExistente = await this.prisma.seccion.findUnique({
            where: { id }
        });
        if (!seccionExistente) {
            throw new Error(`Sección con ID ${id} no encontrada`);
        }
        // Validar que el nuevo distrito sea válido si se proporciona
        if (datos.distritoMunicipalId !== undefined && datos.distritoMunicipalId !== seccionExistente.distritoMunicipalId) {
            const distritoExistente = await this.prisma.distritoMunicipal.findUnique({
                where: { id: datos.distritoMunicipalId }
            });
            if (!distritoExistente) {
                throw new Error(`Distrito Municipal con ID ${datos.distritoMunicipalId} no encontrado`);
            }
            if (distritoExistente.estado !== 'Activo') {
                throw new Error(`El distrito municipal con ID ${datos.distritoMunicipalId} no se encuentra en estado Activo`);
            }
        }
        const distritoPrevioId = seccionExistente.distritoMunicipalId;
        const updateData = {};
        if (datos.distritoMunicipalId !== undefined) {
            updateData.distritoMunicipalId = datos.distritoMunicipalId;
        }
        if (datos.nombre !== undefined) {
            updateData.nombre = datos.nombre;
        }
        if (datos.estado !== undefined) {
            updateData.estado = datos.estado;
        }
        const actualizada = await this.prisma.seccion.update({
            where: { id },
            data: updateData
        });
        // Invalidar cachés
        await this.redis.del(this.CACHE_KEY);
        await this.redis.del(`${this.CACHE_KEY}:Activo`);
        await this.redis.del(`${this.CACHE_KEY}:Inactivo`);
        if (distritoPrevioId) {
            await this.invalidarCaches(distritoPrevioId);
        }
        if (actualizada.distritoMunicipalId) {
            await this.invalidarCaches(actualizada.distritoMunicipalId);
        }
        return new Seccion_1.Seccion(actualizada.id, actualizada.distritoMunicipalId, actualizada.nombre, actualizada.estado, actualizada.creadoEn);
    }
    async eliminar(id) {
        const seccion = await this.prisma.seccion.findUnique({
            where: { id }
        });
        if (!seccion) {
            throw new Error(`Sección con ID ${id} no encontrada`);
        }
        const eliminada = await this.prisma.seccion.update({
            where: { id },
            data: { estado: 'Eliminado' }
        });
        // Invalidar cachés
        await this.redis.del(this.CACHE_KEY);
        await this.redis.del(`${this.CACHE_KEY}:Activo`);
        await this.redis.del(`${this.CACHE_KEY}:Inactivo`);
        if (seccion.distritoMunicipalId) {
            await this.invalidarCaches(seccion.distritoMunicipalId);
        }
        return new Seccion_1.Seccion(eliminada.id, eliminada.distritoMunicipalId, eliminada.nombre, eliminada.estado, eliminada.creadoEn);
    }
    async invalidarCaches(distritoMunicipalId) {
        await Promise.all([
            this.redis.del(this.CACHE_KEY_POR_DISTRITO(distritoMunicipalId)),
            this.redis.del(`${this.CACHE_KEY_POR_DISTRITO(distritoMunicipalId)}:Activo`),
            this.redis.del(`${this.CACHE_KEY_POR_DISTRITO(distritoMunicipalId)}:Inactivo}`)
        ]);
    }
}
exports.PrismaSeccionesRepository = PrismaSeccionesRepository;
