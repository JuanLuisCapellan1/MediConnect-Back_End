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
        this.CACHE_TTL = 24 * 60 * 60; // 24 horas
    }
    toEntity(u, puntoGeografico = null) {
        return new Ubicacion_1.Ubicacion(u.id, u.barrioId, u.direccion, u.estado, u.creadoEn ?? new Date(u.creado_en ?? u.creadoEn), u.codigoPostal ?? null, puntoGeografico, u.nombre ?? null);
    }
    async crear(barrioId, direccion, codigoPostal, puntoGeografico, nombre) {
        try {
            const ubicacion = await this.prisma.ubicacion.create({
                data: {
                    barrioId,
                    direccion: direccion.trim(),
                    codigoPostal: codigoPostal ? codigoPostal.trim() : null,
                    nombre: nombre ? nombre.trim() : null,
                    estado: 'Activo',
                },
            });
            if (puntoGeografico) {
                await this.guardarPuntoGeografico(ubicacion.id, puntoGeografico);
            }
            await this.invalidarCache(barrioId);
            const puntoGuardado = puntoGeografico
                ? await this.leerPuntoGeografico(ubicacion.id)
                : null;
            return this.toEntity(ubicacion, puntoGuardado);
        }
        catch (error) {
            if (error.message?.includes('P0001'))
                throw new UbicacionFueraDeRangoError_1.UbicacionFueraDeRangoError();
            throw error;
        }
    }
    async listarTodas() {
        const cached = await this.cache.get(this.CACHE_KEY);
        if (cached) {
            const data = JSON.parse(cached);
            const ids = data.map((u) => u.id);
            const puntos = await this.leerPuntosGeograficosMultiples(ids);
            return data.map((u) => this.toEntity(u, puntos.get(u.id) ?? null));
        }
        const ubicaciones = await this.prisma.ubicacion.findMany({
            where: { estado: { not: 'Eliminado' } },
            orderBy: { id: 'asc' },
        });
        await this.cache.set(this.CACHE_KEY, JSON.stringify(ubicaciones), this.CACHE_TTL);
        const ids = ubicaciones.map(u => u.id);
        const puntos = await this.leerPuntosGeograficosMultiples(ids);
        return ubicaciones.map(u => this.toEntity(u, puntos.get(u.id) ?? null));
    }
    async listarPorBarrio(barrioId) {
        const cacheKey = this.CACHE_KEY_POR_BARRIO(barrioId);
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            const data = JSON.parse(cached);
            const ids = data.map((u) => u.id);
            const puntos = await this.leerPuntosGeograficosMultiples(ids);
            return data.map((u) => this.toEntity(u, puntos.get(u.id) ?? null));
        }
        const ubicaciones = await this.prisma.ubicacion.findMany({
            where: { barrioId, estado: { not: 'Eliminado' } },
            orderBy: { id: 'asc' },
        });
        await this.cache.set(cacheKey, JSON.stringify(ubicaciones), this.CACHE_TTL);
        const ids = ubicaciones.map(u => u.id);
        const puntos = await this.leerPuntosGeograficosMultiples(ids);
        return ubicaciones.map(u => this.toEntity(u, puntos.get(u.id) ?? null));
    }
    async buscarPorId(id) {
        const ubicacion = await this.prisma.ubicacion.findUnique({ where: { id } });
        if (!ubicacion || ubicacion.estado === 'Eliminado')
            return null;
        const puntoGeografico = await this.leerPuntoGeografico(id);
        return this.toEntity(ubicacion, puntoGeografico);
    }
    async buscarPorDireccion(direccion) {
        const ubicaciones = await this.prisma.ubicacion.findMany({
            where: { direccion: { contains: direccion, mode: 'insensitive' }, estado: { not: 'Eliminado' } },
        });
        const ids = ubicaciones.map(u => u.id);
        const puntos = await this.leerPuntosGeograficosMultiples(ids);
        return ubicaciones.map(u => this.toEntity(u, puntos.get(u.id) ?? null));
    }
    async buscarPorCodigoPostal(codigoPostal) {
        const ubicaciones = await this.prisma.ubicacion.findMany({
            where: { codigoPostal, estado: { not: 'Eliminado' } },
        });
        const ids = ubicaciones.map(u => u.id);
        const puntos = await this.leerPuntosGeograficosMultiples(ids);
        return ubicaciones.map(u => this.toEntity(u, puntos.get(u.id) ?? null));
    }
    async buscarPorEstado(estado) {
        const ubicaciones = await this.prisma.ubicacion.findMany({ where: { estado } });
        const ids = ubicaciones.map(u => u.id);
        const puntos = await this.leerPuntosGeograficosMultiples(ids);
        return ubicaciones.map(u => this.toEntity(u, puntos.get(u.id) ?? null));
    }
    async actualizar(id, barrioId, direccion, codigoPostal, estado, puntoGeografico, nombre) {
        try {
            const existente = await this.prisma.ubicacion.findUnique({ where: { id } });
            if (!existente)
                throw new Error(`Ubicacion con ID ${id} no existe`);
            const data = {};
            if (direccion !== undefined)
                data.direccion = direccion.trim();
            if (codigoPostal !== undefined)
                data.codigoPostal = codigoPostal ? codigoPostal.trim() : null;
            if (barrioId !== undefined)
                data.barrioId = barrioId;
            if (estado !== undefined)
                data.estado = estado;
            if (nombre !== undefined)
                data.nombre = nombre ? nombre.trim() : null;
            const actualizada = await this.prisma.ubicacion.update({ where: { id }, data });
            if (puntoGeografico) {
                await this.guardarPuntoGeografico(id, puntoGeografico);
            }
            await this.invalidarCache(existente.barrioId);
            if (barrioId && barrioId !== existente.barrioId) {
                await this.invalidarCache(barrioId);
            }
            const puntoGuardado = puntoGeografico ? await this.leerPuntoGeografico(id) : null;
            return this.toEntity(actualizada, puntoGuardado);
        }
        catch (error) {
            if (error.message?.includes('P0001'))
                throw new UbicacionFueraDeRangoError_1.UbicacionFueraDeRangoError();
            throw error;
        }
    }
    async eliminar(id) {
        const ubicacion = await this.prisma.ubicacion.findUnique({ where: { id } });
        if (!ubicacion)
            throw new Error(`Ubicacion con ID ${id} no existe`);
        const centrosSalud = await this.prisma.centroSalud.count({ where: { ubicacionId: id } });
        if (centrosSalud > 0)
            throw new Error(`No se puede eliminar: tiene ${centrosSalud} centro(s) de salud asociado(s)`);
        const horarios = await this.prisma.horario.count({ where: { ubicacionId: id } });
        if (horarios > 0)
            throw new Error(`No se puede eliminar: tiene ${horarios} horario(s) asociado(s)`);
        const citas = await this.prisma.cita.count({ where: { ubicacionId: id } });
        if (citas > 0)
            throw new Error(`No se puede eliminar: tiene ${citas} cita(s) asociada(s)`);
        const pacientes = await this.prisma.paciente.count({ where: { ubicacionId: id } });
        if (pacientes > 0)
            throw new Error(`No se puede eliminar: hay ${pacientes} paciente(s) asociado(s)`);
        const eliminada = await this.prisma.ubicacion.update({
            where: { id },
            data: { estado: 'Eliminado' },
        });
        await this.invalidarCache(ubicacion.barrioId);
        return this.toEntity(eliminada);
    }
    async invalidarCache(barrioId) {
        await Promise.all([
            this.cache.del(this.CACHE_KEY),
            this.cache.del(this.CACHE_KEY_POR_BARRIO(barrioId)),
        ]);
    }
    async leerPuntoGeografico(id) {
        try {
            const resultado = await this.prisma.$queryRaw `
        SELECT ST_AsGeoJSON("punto_geografico") as punto_geografico
        FROM "ubicaciones"
        WHERE "id_ubicacion" = ${id}
      `;
            const raw = resultado?.[0]?.punto_geografico;
            if (!raw)
                return null;
            try {
                return JSON.parse(raw);
            }
            catch {
                return null;
            }
        }
        catch {
            return null;
        }
    }
    async leerPuntosGeograficosMultiples(ids) {
        const resultado = new Map();
        if (ids.length === 0)
            return resultado;
        ids.forEach(id => resultado.set(id, null));
        try {
            const puntos = await this.prisma.$queryRaw `
        SELECT "id_ubicacion", ST_AsGeoJSON("punto_geografico") as punto_geografico
        FROM "ubicaciones"
        WHERE "id_ubicacion" = ANY(${ids}::integer[])
      `;
            puntos.forEach(p => {
                if (p.punto_geografico) {
                    try {
                        resultado.set(p.id_ubicacion, JSON.parse(p.punto_geografico));
                    }
                    catch { /* ignorar */ }
                }
            });
        }
        catch {
            // retornar mapa con null en caso de error
        }
        return resultado;
    }
    async guardarPuntoGeografico(id, puntoGeografico) {
        await this.prisma.$executeRaw `
      UPDATE "ubicaciones"
      SET "punto_geografico" = ST_SetSRID(ST_GeomFromGeoJSON(${puntoGeografico}::jsonb), 4326)
      WHERE "id_ubicacion" = ${id}
    `;
    }
    async listarPorDoctor(doctorId) {
        // Una sola query: todas las ubicaciones donde id_doctor = doctorId
        const ubicaciones = await this.prisma.ubicacion.findMany({
            where: { id_doctor: doctorId, estado: { not: 'Eliminado' } },
            orderBy: { id: 'asc' },
        });
        if (ubicaciones.length === 0)
            return [];
        const puntos = await this.leerPuntosGeograficosMultiples(ubicaciones.map((u) => u.id));
        return ubicaciones.map((u) => this.toEntity(u, puntos.get(u.id) ?? null));
    }
    async crearParaDoctor(doctorId, barrioId, direccion, codigoPostal, puntoGeografico, nombre) {
        const nueva = await this.crearConDoctor(doctorId, barrioId, direccion, codigoPostal, puntoGeografico, nombre);
        return nueva;
    }
    async crearConDoctor(doctorId, barrioId, direccion, codigoPostal, puntoGeografico, nombre) {
        const nueva = await this.prisma.ubicacion.create({
            data: {
                barrioId,
                direccion,
                codigoPostal: codigoPostal ?? null,
                nombre: nombre ? nombre.trim() : null,
                estado: 'Activo',
                id_doctor: doctorId,
            },
        });
        if (puntoGeografico) {
            await this.prisma.$executeRaw `
        UPDATE "ubicaciones"
        SET "punto_geografico" = ST_SetSRID(ST_GeomFromGeoJSON(${puntoGeografico}::jsonb), 4326)
        WHERE "id_ubicacion" = ${nueva.id}
      `;
        }
        const punto = puntoGeografico
            ? await this.leerPuntoGeografico(nueva.id)
            : null;
        return this.toEntity(nueva, punto);
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
