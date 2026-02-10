"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaDistritosMunicipalesRepository = void 0;
const DistritoMunicipal_1 = require("../../domain/entities/DistritoMunicipal");
class PrismaDistritosMunicipalesRepository {
    constructor(prisma, redis) {
        this.CACHE_KEY = 'distritos:listado';
        this.CACHE_KEY_POR_MUNICIPIO = (municipioId) => `distritos:municipio:${municipioId}`;
        this.prisma = prisma;
        this.redis = redis;
    }
    async listarTodas() {
        // 1. Intentar obtener de Redis
        const cached = await this.redis.get(this.CACHE_KEY);
        if (cached)
            return JSON.parse(cached);
        // 2. Si no hay caché, buscar en DB
        const distritosOrm = await this.prisma.distritoMunicipal.findMany({
            where: { estado: { notIn: ['Eliminado', 'Inactivo'] } },
            orderBy: { nombre: 'asc' }
        });
        // 3. Mapear a Entidad de Dominio
        const distritos = distritosOrm.map(d => new DistritoMunicipal_1.DistritoMunicipal(d.id, d.municipioId, d.nombre, d.estado, d.creadoEn));
        // 4. Guardar en Redis (TTL 24 horas porque esto cambia poco)
        await this.redis.set(this.CACHE_KEY, JSON.stringify(distritos), 86400);
        return distritos;
    }
    async listarPorMunicipio(municipioId) {
        const cacheKey = this.CACHE_KEY_POR_MUNICIPIO(municipioId);
        // 1. Intentar obtener de Redis
        const cached = await this.redis.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        // 2. Si no hay caché, buscar en DB
        const distritosOrm = await this.prisma.distritoMunicipal.findMany({
            where: {
                municipioId: municipioId,
                estado: { notIn: ['Eliminado', 'Inactivo'] }
            },
            orderBy: { nombre: 'asc' }
        });
        // 3. Mapear a Entidad de Dominio
        const distritos = distritosOrm.map(d => new DistritoMunicipal_1.DistritoMunicipal(d.id, d.municipioId, d.nombre, d.estado, d.creadoEn));
        // 4. Guardar en Redis
        await this.redis.set(cacheKey, JSON.stringify(distritos), 86400);
        return distritos;
    }
    async crear(municipioId, nombre) {
        const nuevo = await this.prisma.distritoMunicipal.create({
            data: {
                municipioId,
                nombre
            }
        });
        // INVALIDAR CACHÉ: Al cambiar datos, la caché vieja no sirve
        await this.redis.del(this.CACHE_KEY);
        await this.redis.del(this.CACHE_KEY_POR_MUNICIPIO(municipioId));
        return new DistritoMunicipal_1.DistritoMunicipal(nuevo.id, nuevo.municipioId, nuevo.nombre, nuevo.estado, nuevo.creadoEn);
    }
    async buscarPorId(id) {
        const encontrado = await this.prisma.distritoMunicipal.findUnique({
            where: { id: id }
        });
        if (!encontrado)
            return null;
        return new DistritoMunicipal_1.DistritoMunicipal(encontrado.id, encontrado.municipioId, encontrado.nombre, encontrado.estado, encontrado.creadoEn);
    }
    async buscarPorNombre(nombre, municipioId, estado) {
        const encontrados = await this.prisma.distritoMunicipal.findMany({
            where: {
                nombre: {
                    contains: nombre,
                    mode: 'insensitive'
                },
                municipioId: municipioId,
                estado: { equals: estado, mode: 'insensitive' }
            }
        });
        if (!encontrados || encontrados.length === 0)
            return [];
        return encontrados.map(d => new DistritoMunicipal_1.DistritoMunicipal(d.id, d.municipioId, d.nombre, d.estado, d.creadoEn));
    }
    async buscarPorEstado(estado) {
        const distritosOrm = await this.prisma.distritoMunicipal.findMany({
            where: {
                estado: {
                    equals: estado,
                    mode: 'insensitive'
                }
            },
            orderBy: { nombre: 'asc' }
        });
        if (!distritosOrm || distritosOrm.length === 0)
            return [];
        return distritosOrm.map(d => new DistritoMunicipal_1.DistritoMunicipal(d.id, d.municipioId, d.nombre, d.estado, d.creadoEn));
    }
    async actualizar(id, municipioId, nombre, estado) {
        // Verificar que el distrito exista antes de actualizar
        const distritoExistente = await this.prisma.distritoMunicipal.findUnique({
            where: { id: id }
        });
        if (!distritoExistente) {
            throw new Error(`Distrito municipal con ID ${id} no encontrado`);
        }
        // Validar que el nuevo municipio sea válido si se proporciona
        if (municipioId !== undefined && municipioId !== distritoExistente.municipioId) {
            const municipioExistente = await this.prisma.municipio.findUnique({
                where: { id: municipioId, estado: 'Activo' }
            });
            if (!municipioExistente) {
                throw new Error(`Municipio con ID ${municipioId} no encontrado`);
            }
            if (municipioExistente.estado !== 'Activo') {
                throw new Error(`El municipio con ID ${municipioId} no se encuentra en estado Activo`);
            }
        }
        // Guardar el municipioId anterior para invalidar su caché
        const municipioPrevioId = distritoExistente.municipioId;
        // Construir objeto de actualización dinámico (solo campos proporcionados)
        const dataActualizar = {};
        if (municipioId !== undefined) {
            dataActualizar.municipioId = municipioId;
        }
        if (nombre !== undefined) {
            dataActualizar.nombre = nombre;
        }
        if (estado !== undefined) {
            dataActualizar.estado = estado;
        }
        const actualizado = await this.prisma.distritoMunicipal.update({
            where: { id: id },
            data: dataActualizar
        });
        // INVALIDAR CACHÉ - Invalidar listado general
        await this.redis.del(this.CACHE_KEY);
        // INVALIDAR CACHÉ - Invalidar caché del municipio anterior (si el municipioId cambió)
        if (municipioId !== undefined && municipioId !== municipioPrevioId) {
            await this.redis.del(this.CACHE_KEY_POR_MUNICIPIO(municipioPrevioId));
        }
        // INVALIDAR CACHÉ - Invalidar caché del municipio actual
        await this.redis.del(this.CACHE_KEY_POR_MUNICIPIO(actualizado.municipioId));
        return new DistritoMunicipal_1.DistritoMunicipal(actualizado.id, actualizado.municipioId, actualizado.nombre, actualizado.estado, actualizado.creadoEn);
    }
    async eliminar(id) {
        const distritoAEliminar = await this.prisma.distritoMunicipal.findUnique({
            where: { id: id }
        });
        if (!distritoAEliminar) {
            throw new Error(`Distrito municipal con ID ${id} no encontrado`);
        }
        const eliminado = await this.prisma.distritoMunicipal.update({
            where: { id: id },
            data: { estado: 'Eliminado' }
        });
        // INVALIDAR CACHÉ
        await this.redis.del(this.CACHE_KEY);
        await this.redis.del(this.CACHE_KEY_POR_MUNICIPIO(eliminado.municipioId));
        return new DistritoMunicipal_1.DistritoMunicipal(eliminado.id, eliminado.municipioId, eliminado.nombre, eliminado.estado, eliminado.creadoEn);
    }
}
exports.PrismaDistritosMunicipalesRepository = PrismaDistritosMunicipalesRepository;
