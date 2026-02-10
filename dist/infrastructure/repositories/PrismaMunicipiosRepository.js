"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaMunicipiosRepository = void 0;
const Municipio_1 = require("../../domain/entities/Municipio");
class PrismaMunicipiosRepository {
    constructor(prisma, redis) {
        this.CACHE_KEY = 'municipios:listado';
        this.CACHE_KEY_POR_PROVINCIA = (provinciaId) => `municipios:provincia:${provinciaId}`;
        this.prisma = prisma;
        this.redis = redis;
    }
    async listarTodas() {
        // 1. Intentar obtener de Redis
        const cached = await this.redis.get(this.CACHE_KEY);
        if (cached)
            return JSON.parse(cached);
        // 2. Si no hay caché, buscar en DB
        const municipiosOrm = await this.prisma.municipio.findMany({
            where: { estado: { notIn: ['Eliminado', 'Inactivo'] } },
            orderBy: { nombre: 'asc' }
        });
        // 3. Mapear a Entidad de Dominio
        const municipios = municipiosOrm.map(m => new Municipio_1.Municipio(m.id, m.provinciaId, m.nombre, m.estado, m.creadoEn));
        // 4. Guardar en Redis (TTL 24 horas porque esto cambia poco)
        await this.redis.set(this.CACHE_KEY, JSON.stringify(municipios), 86400);
        return municipios;
    }
    async listarPorProvincia(provinciaId) {
        const cacheKey = this.CACHE_KEY_POR_PROVINCIA(provinciaId);
        // 1. Intentar obtener de Redis
        const cached = await this.redis.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        // 2. Si no hay caché, buscar en DB
        const municipiosOrm = await this.prisma.municipio.findMany({
            where: {
                provinciaId: provinciaId,
                estado: { notIn: ['Eliminado', 'Inactivo'] }
            },
            orderBy: { nombre: 'asc' }
        });
        // 3. Mapear a Entidad de Dominio
        const municipios = municipiosOrm.map(m => new Municipio_1.Municipio(m.id, m.provinciaId, m.nombre, m.estado, m.creadoEn));
        // 4. Guardar en Redis
        await this.redis.set(cacheKey, JSON.stringify(municipios), 86400);
        return municipios;
    }
    async crear(provinciaId, nombre) {
        const nuevo = await this.prisma.municipio.create({
            data: {
                provinciaId,
                nombre
            }
        });
        // INVALIDAR CACHÉ: Al cambiar datos, la caché vieja no sirve
        await this.redis.del(this.CACHE_KEY);
        await this.redis.del(this.CACHE_KEY_POR_PROVINCIA(provinciaId));
        return new Municipio_1.Municipio(nuevo.id, nuevo.provinciaId, nuevo.nombre, nuevo.estado, nuevo.creadoEn);
    }
    async buscarPorId(id) {
        const encontrado = await this.prisma.municipio.findUnique({
            where: { id: id }
        });
        if (!encontrado)
            return null;
        return new Municipio_1.Municipio(encontrado.id, encontrado.provinciaId, encontrado.nombre, encontrado.estado, encontrado.creadoEn);
    }
    async buscarPorNombre(nombre, provinciaId, estado) {
        const encontrados = await this.prisma.municipio.findMany({
            where: {
                nombre: {
                    contains: nombre,
                    mode: 'insensitive'
                },
                provinciaId: provinciaId,
                estado: { equals: estado, mode: 'insensitive' }
            }
        });
        if (!encontrados || encontrados.length === 0)
            return [];
        return encontrados.map(m => new Municipio_1.Municipio(m.id, m.provinciaId, m.nombre, m.estado, m.creadoEn));
    }
    async buscarPorEstado(estado) {
        const municipiosOrm = await this.prisma.municipio.findMany({
            where: {
                estado: {
                    equals: estado,
                    mode: 'insensitive'
                }
            },
            orderBy: { nombre: 'asc' }
        });
        if (!municipiosOrm || municipiosOrm.length === 0)
            return [];
        return municipiosOrm.map(m => new Municipio_1.Municipio(m.id, m.provinciaId, m.nombre, m.estado, m.creadoEn));
    }
    async actualizar(id, provinciaId, nombre, estado) {
        // Verificar que el municipio exista antes de actualizar
        const municipioExistente = await this.prisma.municipio.findUnique({
            where: { id: id }
        });
        if (!municipioExistente) {
            throw new Error(`Municipio con ID ${id} no encontrado`);
        }
        // Validar que la nueva provincia sea válida si se proporciona
        if (provinciaId !== undefined && provinciaId !== municipioExistente.provinciaId) {
            const provinciaExistente = await this.prisma.provincia.findUnique({
                where: { id: provinciaId, estado: 'Activo' }
            });
            if (!provinciaExistente) {
                throw new Error(`Provincia con ID ${provinciaId} no encontrada`);
            }
            if (provinciaExistente.estado !== 'Activo') {
                throw new Error(`La provincia con ID ${provinciaId} no se encuentra en estado Activo`);
            }
        }
        // Guardar el provinciaId anterior para invalidar su caché
        const provinciaPreviaId = municipioExistente.provinciaId;
        // Construir objeto de actualización dinámico (solo campos proporcionados)
        const dataActualizar = {};
        if (provinciaId !== undefined) {
            dataActualizar.provinciaId = provinciaId;
        }
        if (nombre !== undefined) {
            dataActualizar.nombre = nombre;
        }
        if (estado !== undefined) {
            dataActualizar.estado = estado;
        }
        const actualizado = await this.prisma.municipio.update({
            where: { id: id },
            data: dataActualizar
        });
        // INVALIDAR CACHÉ - Invalidar listado general
        await this.redis.del(this.CACHE_KEY);
        // INVALIDAR CACHÉ - Invalidar caché de la provincia anterior (si el provinciaId cambió)
        if (provinciaId !== undefined && provinciaId !== provinciaPreviaId) {
            await this.redis.del(this.CACHE_KEY_POR_PROVINCIA(provinciaPreviaId));
        }
        // INVALIDAR CACHÉ - Invalidar caché de la provincia actual
        await this.redis.del(this.CACHE_KEY_POR_PROVINCIA(actualizado.provinciaId));
        return new Municipio_1.Municipio(actualizado.id, actualizado.provinciaId, actualizado.nombre, actualizado.estado, actualizado.creadoEn);
    }
    async eliminar(id) {
        const municipioAEliminar = await this.prisma.municipio.findUnique({
            where: { id: id }
        });
        if (!municipioAEliminar) {
            throw new Error(`Municipio con ID ${id} no encontrado`);
        }
        const eliminado = await this.prisma.municipio.update({
            where: { id: id },
            data: { estado: 'Eliminado' }
        });
        // INVALIDAR CACHÉ
        await this.redis.del(this.CACHE_KEY);
        await this.redis.del(this.CACHE_KEY_POR_PROVINCIA(eliminado.provinciaId));
        return new Municipio_1.Municipio(eliminado.id, eliminado.provinciaId, eliminado.nombre, eliminado.estado, eliminado.creadoEn);
    }
}
exports.PrismaMunicipiosRepository = PrismaMunicipiosRepository;
