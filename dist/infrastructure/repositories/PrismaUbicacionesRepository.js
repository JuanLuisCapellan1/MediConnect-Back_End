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
exports.PrismaUbicacionesRepository = void 0;
const client_1 = require("@prisma/client");
const RedisCacheService_1 = require("../external-services/RedisCacheService");
const Ubicacion_1 = require("../../domain/entities/Ubicacion");
const UbicacionFueraDeRangoError_1 = require("../../domain/errors/UbicacionFueraDeRangoError");
const tsyringe_1 = require("tsyringe");
let PrismaUbicacionesRepository = class PrismaUbicacionesRepository {
    constructor(prisma, cache) {
        this.prisma = prisma;
        this.cache = cache;
        this.CACHE_KEY = 'ubicaciones:listado';
        this.CACHE_KEY_POR_BARRIO = (barrioId) => `ubicaciones:barrio:${barrioId}`;
        this.CACHE_KEY_POR_SUBBARRIO = (subBarrioId) => `ubicaciones:subBarrio:${subBarrioId}`;
        this.CACHE_TTL = 24 * 60 * 60; // 24 horas en segundos
    }
    /**
     * Crea una nueva Ubicacion
     */
    async crear(barrioId, direccion, subBarrioId, codigoPostal, puntoGeografico) {
        try {
            const ubicacion = await this.prisma.ubicacion.create({
                data: {
                    barrioId,
                    subBarrioId: subBarrioId || null,
                    direccion: direccion.trim(),
                    codigoPostal: codigoPostal ? codigoPostal.trim() : null,
                    estado: 'Activo',
                },
            });
            // Si se proporcionó un punto geográfico, guardar usando raw SQL con ST_GeomFromGeoJSON
            if (puntoGeografico) {
                await this.guardarPuntoGeografico(ubicacion.id, puntoGeografico);
            }
            // Invalidar caché
            await this.invalidarCache(barrioId, subBarrioId);
            // Leer el punto geográfico si fue guardado
            const puntoGeograficoGuardado = puntoGeografico
                ? await this.leerPuntoGeografico(ubicacion.id)
                : null;
            return new Ubicacion_1.Ubicacion(ubicacion.id, ubicacion.barrioId, ubicacion.direccion, ubicacion.estado, ubicacion.creadoEn, ubicacion.subBarrioId, ubicacion.codigoPostal, puntoGeograficoGuardado);
        }
        catch (error) {
            // Capturar errores de triggers (código P0001 de PostgreSQL)
            // Cuando el trigger validar_zona_operativa se dispara
            if (error.message && error.message.includes('P0001')) {
                throw new UbicacionFueraDeRangoError_1.UbicacionFueraDeRangoError();
            }
            // Re-lanzar otros errores
            throw error;
        }
    }
    /**
     * Lista todas las Ubicaciones
     */
    async listarTodas() {
        // Intentar obtener del caché
        const cached = await this.cache.get(this.CACHE_KEY);
        if (cached) {
            const ubicacionesData = JSON.parse(cached);
            const ids = ubicacionesData.map((u) => u.id);
            const puntos = await this.leerPuntosGeograficosMultiples(ids);
            return ubicacionesData.map((u) => new Ubicacion_1.Ubicacion(u.id, u.barrioId, u.direccion, u.estado, new Date(u.creadoEn), u.subBarrioId, u.codigoPostal, puntos.get(u.id) || null));
        }
        // Si no está en caché, obtener de la BD
        const ubicaciones = await this.prisma.ubicacion.findMany({
            where: { estado: { not: 'Eliminado' } },
            orderBy: { id: 'asc' },
        });
        // Guardar en caché
        await this.cache.set(this.CACHE_KEY, JSON.stringify(ubicaciones), this.CACHE_TTL);
        // Leer puntos geográficos en una sola query
        const ids = ubicaciones.map(u => u.id);
        const puntos = await this.leerPuntosGeograficosMultiples(ids);
        return ubicaciones.map(u => new Ubicacion_1.Ubicacion(u.id, u.barrioId, u.direccion, u.estado, u.creadoEn, u.subBarrioId, u.codigoPostal, puntos.get(u.id) || null));
    }
    /**
     * Lista todas las Ubicaciones de un barrio específico
     */
    async listarPorBarrio(barrioId) {
        const cacheKey = this.CACHE_KEY_POR_BARRIO(barrioId);
        // Intentar obtener del caché
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            const ubicacionesData = JSON.parse(cached);
            const ids = ubicacionesData.map((u) => u.id);
            const puntos = await this.leerPuntosGeograficosMultiples(ids);
            return ubicacionesData.map((u) => new Ubicacion_1.Ubicacion(u.id, u.barrioId, u.direccion, u.estado, new Date(u.creadoEn), u.subBarrioId, u.codigoPostal, puntos.get(u.id) || null));
        }
        // Si no está en caché, obtener de la BD
        const ubicaciones = await this.prisma.ubicacion.findMany({
            where: {
                barrioId,
                estado: { not: 'Eliminado' },
            },
            orderBy: { id: 'asc' },
        });
        // Guardar en caché
        await this.cache.set(cacheKey, JSON.stringify(ubicaciones), this.CACHE_TTL);
        // Leer puntos geográficos en una sola query
        const ids = ubicaciones.map(u => u.id);
        const puntos = await this.leerPuntosGeograficosMultiples(ids);
        return ubicaciones.map(u => new Ubicacion_1.Ubicacion(u.id, u.barrioId, u.direccion, u.estado, u.creadoEn, u.subBarrioId, u.codigoPostal, puntos.get(u.id) || null));
    }
    /**
     * Lista todas las Ubicaciones de un SubBarrio específico
     */
    async listarPorSubBarrio(subBarrioId) {
        const cacheKey = this.CACHE_KEY_POR_SUBBARRIO(subBarrioId);
        // Intentar obtener del caché
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            const ubicacionesData = JSON.parse(cached);
            const ids = ubicacionesData.map((u) => u.id);
            const puntos = await this.leerPuntosGeograficosMultiples(ids);
            return ubicacionesData.map((u) => new Ubicacion_1.Ubicacion(u.id, u.barrioId, u.direccion, u.estado, new Date(u.creadoEn), u.subBarrioId, u.codigoPostal, puntos.get(u.id) || null));
        }
        // Si no está en caché, obtener de la BD
        const ubicaciones = await this.prisma.ubicacion.findMany({
            where: {
                subBarrioId,
                estado: { not: 'Eliminado' },
            },
            orderBy: { id: 'asc' },
        });
        // Guardar en caché
        await this.cache.set(cacheKey, JSON.stringify(ubicaciones), this.CACHE_TTL);
        // Leer puntos geográficos en una sola query
        const ids = ubicaciones.map(u => u.id);
        const puntos = await this.leerPuntosGeograficosMultiples(ids);
        return ubicaciones.map(u => new Ubicacion_1.Ubicacion(u.id, u.barrioId, u.direccion, u.estado, u.creadoEn, u.subBarrioId, u.codigoPostal, puntos.get(u.id) || null));
    }
    /**
     * Busca una Ubicacion por ID
     */
    async buscarPorId(id) {
        const ubicacion = await this.prisma.ubicacion.findUnique({
            where: { id },
        });
        if (!ubicacion || ubicacion.estado === 'Eliminado') {
            return null;
        }
        // Leer el punto geográfico si existe
        const puntoGeografico = await this.leerPuntoGeografico(id);
        return new Ubicacion_1.Ubicacion(ubicacion.id, ubicacion.barrioId, ubicacion.direccion, ubicacion.estado, ubicacion.creadoEn, ubicacion.subBarrioId, ubicacion.codigoPostal, puntoGeografico);
    }
    /**
     * Busca Ubicaciones por dirección
     */
    async buscarPorDireccion(direccion) {
        const ubicaciones = await this.prisma.ubicacion.findMany({
            where: {
                direccion: { contains: direccion, mode: 'insensitive' },
                estado: { not: 'Eliminado' },
            },
        });
        // Leer puntos geográficos en una sola query
        const ids = ubicaciones.map(u => u.id);
        const puntos = await this.leerPuntosGeograficosMultiples(ids);
        return ubicaciones.map(u => new Ubicacion_1.Ubicacion(u.id, u.barrioId, u.direccion, u.estado, u.creadoEn, u.subBarrioId, u.codigoPostal, puntos.get(u.id) || null));
    }
    /**
     * Busca Ubicaciones por código postal
     */
    async buscarPorCodigoPostal(codigoPostal) {
        const ubicaciones = await this.prisma.ubicacion.findMany({
            where: {
                codigoPostal,
                estado: { not: 'Eliminado' },
            },
        });
        // Leer puntos geográficos en una sola query
        const ids = ubicaciones.map(u => u.id);
        const puntos = await this.leerPuntosGeograficosMultiples(ids);
        return ubicaciones.map(u => new Ubicacion_1.Ubicacion(u.id, u.barrioId, u.direccion, u.estado, u.creadoEn, u.subBarrioId, u.codigoPostal, puntos.get(u.id) || null));
    }
    /**
     * Busca Ubicaciones por estado
     */
    async buscarPorEstado(estado) {
        const ubicaciones = await this.prisma.ubicacion.findMany({
            where: {
                estado,
            },
        });
        // Leer puntos geográficos en una sola query
        const ids = ubicaciones.map(u => u.id);
        const puntos = await this.leerPuntosGeograficosMultiples(ids);
        return ubicaciones.map(u => new Ubicacion_1.Ubicacion(u.id, u.barrioId, u.direccion, u.estado, u.creadoEn, u.subBarrioId, u.codigoPostal, puntos.get(u.id) || null));
    }
    /**
     * Actualiza una Ubicacion existente
     */
    async actualizar(id, barrioId, subBarrioId, direccion, codigoPostal, estado, puntoGeografico) {
        try {
            const ubicacionExistente = await this.prisma.ubicacion.findUnique({
                where: { id },
            });
            if (!ubicacionExistente) {
                throw new Error(`Ubicacion con ID ${id} no existe`);
            }
            const datosActualizacion = {};
            if (direccion !== undefined)
                datosActualizacion.direccion = direccion.trim();
            if (codigoPostal !== undefined)
                datosActualizacion.codigoPostal = codigoPostal ? codigoPostal.trim() : null;
            if (barrioId !== undefined)
                datosActualizacion.barrioId = barrioId;
            if (subBarrioId !== undefined)
                datosActualizacion.subBarrioId = subBarrioId || null;
            if (estado !== undefined)
                datosActualizacion.estado = estado;
            const ubicacionActualizada = await this.prisma.ubicacion.update({
                where: { id },
                data: datosActualizacion,
            });
            // Si se proporcionó un punto geográfico, guardar usando raw SQL con ST_GeomFromGeoJSON
            if (puntoGeografico) {
                await this.guardarPuntoGeografico(id, puntoGeografico);
            }
            // Invalidar caché del barrio anterior y nuevo
            const barrioAnterior = ubicacionExistente.barrioId;
            const subBarrioAnterior = ubicacionExistente.subBarrioId || undefined;
            const barrioNuevo = barrioId || ubicacionExistente.barrioId;
            const subBarrioNuevo = subBarrioId !== undefined ? subBarrioId : ubicacionExistente.subBarrioId;
            await this.invalidarCache(barrioAnterior, subBarrioAnterior);
            if (barrioNuevo !== barrioAnterior || subBarrioNuevo !== (subBarrioAnterior || undefined)) {
                await this.invalidarCache(barrioNuevo, subBarrioNuevo || undefined);
            }
            // Leer el punto geográfico si fue actualizado
            const puntoGeograficoGuardado = puntoGeografico
                ? await this.leerPuntoGeografico(id)
                : null;
            return new Ubicacion_1.Ubicacion(ubicacionActualizada.id, ubicacionActualizada.barrioId, ubicacionActualizada.direccion, ubicacionActualizada.estado, ubicacionActualizada.creadoEn, ubicacionActualizada.subBarrioId, ubicacionActualizada.codigoPostal, puntoGeograficoGuardado);
        }
        catch (error) {
            // Capturar errores de triggers (código P0001 de PostgreSQL)
            // Cuando el trigger validar_zona_operativa se dispara
            if (error.message && error.message.includes('P0001')) {
                throw new UbicacionFueraDeRangoError_1.UbicacionFueraDeRangoError();
            }
            // Re-lanzar otros errores
            throw error;
        }
    }
    /**
     * Elimina una Ubicacion (eliminación lógica)
     */
    async eliminar(id) {
        const ubicacion = await this.prisma.ubicacion.findUnique({ where: { id } });
        if (!ubicacion) {
            throw new Error(`Ubicacion con ID ${id} no existe`);
        }
        // Verificar que no haya centros de salud, horarios, citas o pacientes asociados
        const centrosSalud = await this.prisma.centroSalud.count({
            where: { ubicacionId: id },
        });
        if (centrosSalud > 0) {
            throw new Error(`No se puede eliminar la ubicación porque tiene ${centrosSalud} centro(s) de salud asociado(s)`);
        }
        const horarios = await this.prisma.horario.count({
            where: { ubicacionId: id },
        });
        if (horarios > 0) {
            throw new Error(`No se puede eliminar la ubicación porque tiene ${horarios} horario(s) asociado(s)`);
        }
        const citas = await this.prisma.cita.count({
            where: { ubicacionId: id },
        });
        if (citas > 0) {
            throw new Error(`No se puede eliminar la ubicación porque tiene ${citas} cita(s) asociada(s)`);
        }
        const pacientes = await this.prisma.paciente.count({
            where: { ubicacionId: id },
        });
        if (pacientes > 0) {
            throw new Error(`No se puede eliminar la ubicación porque hay ${pacientes} paciente(s) asociado(s)`);
        }
        // Eliminación lógica
        const ubicacionEliminada = await this.prisma.ubicacion.update({
            where: { id },
            data: { estado: 'Eliminado' },
        });
        // Invalidar caché
        await this.invalidarCache(ubicacion.barrioId, ubicacion.subBarrioId || undefined);
        return new Ubicacion_1.Ubicacion(ubicacionEliminada.id, ubicacionEliminada.barrioId, ubicacionEliminada.direccion, ubicacionEliminada.estado, ubicacionEliminada.creadoEn, ubicacionEliminada.subBarrioId, ubicacionEliminada.codigoPostal, null);
    }
    /**
     * Invalida todas las claves de caché relacionadas con Ubicaciones
     */
    async invalidarCache(barrioId, subBarrioId) {
        const keys = [this.CACHE_KEY, this.CACHE_KEY_POR_BARRIO(barrioId)];
        if (subBarrioId) {
            keys.push(this.CACHE_KEY_POR_SUBBARRIO(subBarrioId));
        }
        await Promise.all(keys.map(key => this.cache.del(key)));
    }
    /**
     * Lee el punto geográfico de una ubicación desde la base de datos
     * Usa ST_AsGeoJSON para convertir la geometría PostGIS a formato GeoJSON
     * @param id - ID de la ubicación
     * @returns Punto geográfico en formato GeoJSON o null si no existe
     */
    async leerPuntoGeografico(id) {
        try {
            const resultado = await this.prisma.$queryRaw `
        SELECT ST_AsGeoJSON("punto_geografico") as punto_geografico
        FROM "ubicaciones"
        WHERE "id_ubicacion" = ${id}
      `;
            if (resultado && resultado.length > 0 && resultado[0].punto_geografico) {
                return resultado[0].punto_geografico;
            }
            return null;
        }
        catch (error) {
            console.error(`Error al leer el punto geográfico de ubicación ${id}:`, error);
            return null;
        }
    }
    /**
     * Lee los puntos geográficos de múltiples ubicaciones en una sola query
     * Optimizado para evitar N+1 queries al recuperar listas
     * @param ids - Array de IDs de ubicaciones
     * @returns Mapa de id -> puntoGeografico GeoJSON
     */
    async leerPuntosGeograficosMultiples(ids) {
        const resultado = new Map();
        if (ids.length === 0) {
            return resultado;
        }
        try {
            const puntos = await this.prisma.$queryRaw `
        SELECT "id_ubicacion", ST_AsGeoJSON("punto_geografico") as punto_geografico
        FROM "ubicaciones"
        WHERE "id_ubicacion" = ANY(${ids}::integer[])
      `;
            // Inicializar todos los IDs con null
            ids.forEach(id => resultado.set(id, null));
            // Actualizar con los puntos encontrados
            puntos.forEach(p => {
                if (p.punto_geografico) {
                    resultado.set(p.id_ubicacion, p.punto_geografico);
                }
            });
            return resultado;
        }
        catch (error) {
            console.error(`Error al leer puntos geográficos para ubicaciones ${ids.join(', ')}:`, error);
            // Retornar mapa con todos en null en caso de error
            const fallback = new Map();
            ids.forEach(id => fallback.set(id, null));
            return fallback;
        }
    }
    /**
     * Guarda un punto geográfico en formato GeoJSON para una ubicación
     * Usa ST_GeomFromGeoJSON para convertir GeoJSON a geometría PostGIS
     * Con validación de SQL injection mediante parametrización
     * @param id - ID de la ubicación
     * @param puntoGeografico - Punto en formato GeoJSON
     */
    async guardarPuntoGeografico(id, puntoGeografico) {
        try {
            await this.prisma.$executeRaw `
        UPDATE "ubicaciones" 
        SET "punto_geografico" = ST_SetSRID(ST_GeomFromGeoJSON(${puntoGeografico}::jsonb), 4326)
        WHERE "id_ubicacion" = ${id}
      `;
        }
        catch (error) {
            console.error(`Error al guardar el punto geográfico para ubicación ${id}:`, error);
            throw error;
        }
    }
};
exports.PrismaUbicacionesRepository = PrismaUbicacionesRepository;
exports.PrismaUbicacionesRepository = PrismaUbicacionesRepository = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('PrismaClient')),
    __param(1, (0, tsyringe_1.inject)('RedisCacheService')),
    __metadata("design:paramtypes", [client_1.PrismaClient,
        RedisCacheService_1.RedisCacheService])
], PrismaUbicacionesRepository);
