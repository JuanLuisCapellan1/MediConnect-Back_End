"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaProvinciasRepository = void 0;
const Provincias_1 = require("../../domain/entities/Provincias");
class PrismaProvinciasRepository {
    constructor(prisma, redis) {
        this.CACHE_KEY = 'provincias:listado';
        this.prisma = prisma;
        this.redis = redis;
    }
    async listarTodas() {
        // 1. Intentar obtener de Redis
        const cached = await this.redis.get(this.CACHE_KEY);
        if (cached)
            return JSON.parse(cached);
        // 2. Si no hay caché, buscar en DB
        const provinciasOrm = await this.prisma.provincia.findMany({
            where: { estado: { notIn: ['Eliminado', 'Inactivo'] } },
            orderBy: { nombre: 'asc' }
        });
        // 3. Mapear a Entidad de Dominio
        const provincias = provinciasOrm.map(p => new Provincias_1.Provincias(p.id, p.nombre, p.estado, p.creadoEn));
        // 4. Guardar en Redis (TTL 24 horas porque esto cambia poco)
        await this.redis.set(this.CACHE_KEY, JSON.stringify(provincias), 86400);
        return provincias;
    }
    async crear(nombre) {
        const nueva = await this.prisma.provincia.create({
            data: { nombre }
        });
        // INVALIDAR CACHÉ: Al cambiar datos, la caché vieja no sirve
        await this.redis.del(this.CACHE_KEY);
        return new Provincias_1.Provincias(nueva.id, nueva.nombre, nueva.estado, nueva.creadoEn);
    }
    async buscarPorId(id) {
        const encontrada = await this.prisma.provincia.findUnique({
            where: { id: id }
        });
        if (!encontrada)
            return null;
        return new Provincias_1.Provincias(encontrada.id, encontrada.nombre, encontrada.estado, encontrada.creadoEn);
    }
    async buscarPorNombre(nombre, estado) {
        const encontrada = await this.prisma.provincia.findMany({
            where: {
                nombre: {
                    contains: nombre,
                    mode: 'insensitive'
                },
                estado: { equals: estado, mode: 'insensitive' }
            }
        });
        if (!encontrada)
            return [];
        return encontrada.map(p => new Provincias_1.Provincias(p.id, p.nombre, p.estado, p.creadoEn));
    }
    async buscarPorEstado(estado) {
        const provinciasOrm = await this.prisma.provincia.findMany({
            where: {
                estado: {
                    equals: estado,
                    mode: 'insensitive'
                }
            },
            orderBy: { nombre: 'asc' }
        });
        if (!provinciasOrm)
            return [];
        return provinciasOrm.map(p => new Provincias_1.Provincias(p.id, p.nombre, p.estado, p.creadoEn));
    }
    async actualizar(id, nombre, estado) {
        // Construir objeto de actualización dinámico (solo campos proporcionados)
        const dataActualizar = {};
        if (nombre !== undefined) {
            dataActualizar.nombre = nombre;
        }
        if (estado !== undefined) {
            dataActualizar.estado = estado;
        }
        const actualizada = await this.prisma.provincia.update({
            where: { id: id },
            data: dataActualizar
        });
        await this.redis.del(this.CACHE_KEY); // Invalidate cache
        return new Provincias_1.Provincias(actualizada.id, actualizada.nombre, actualizada.estado, actualizada.creadoEn);
    }
    async eliminar(id) {
        // Soft Delete
        const eliminada = await this.prisma.provincia.update({
            where: { id: id },
            data: { estado: 'Eliminado' }
        });
        await this.redis.del(this.CACHE_KEY); // Invalidate cache
        return new Provincias_1.Provincias(eliminada.id, eliminada.nombre, eliminada.estado, eliminada.creadoEn);
    }
}
exports.PrismaProvinciasRepository = PrismaProvinciasRepository;
