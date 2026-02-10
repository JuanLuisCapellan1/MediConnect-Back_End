"use strict";
/**
 * PrismaHorariosRepository.ts
 * Implementación del repositorio para Horarios usando Prisma ORM y Redis para caching
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaHorariosRepository = void 0;
const client_1 = require("@prisma/client");
const Horario_1 = require("../../domain/entities/Horario");
const HorarioConflictoError_1 = require("../../domain/errors/Horarios/HorarioConflictoError");
class PrismaHorariosRepository {
    constructor(prisma, redis) {
        this.CACHE_KEY = 'horarios:listado';
        this.CACHE_KEY_POR_DOCTOR = (doctorId) => `horarios:doctor:${doctorId}`;
        this.CACHE_KEY_POR_DIA = (diaSemana) => `horarios:dia:${diaSemana}`;
        this.CACHE_KEY_POR_ESTADO = (estado) => `horarios:estado:${estado}`;
        this.CACHE_TTL = 24 * 60 * 60; // 24 horas en segundos
        this.prisma = prisma;
        this.redis = redis;
    }
    async crear(doctorId, nombre, diaSemana, horaInicio, horaFin, ubicacionId) {
        try {
            const creado = await this.prisma.horario.create({
                data: {
                    doctorId,
                    nombre: nombre.trim(),
                    diaSemana,
                    horaInicio,
                    horaFin,
                    ubicacionId,
                    estado: 'Activo'
                }
            });
            // INVALIDAR CACHÉ: Al cambiar datos, la caché vieja no sirve
            await this.redis.del(this.CACHE_KEY);
            await this.redis.del(this.CACHE_KEY_POR_DOCTOR(doctorId));
            await this.redis.del(this.CACHE_KEY_POR_DIA(diaSemana));
            return this.mapToDomain(creado);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new HorarioConflictoError_1.HorarioConflictoError();
                }
            }
            throw error;
        }
    }
    async listarTodos() {
        // 1. Intentar obtener de Redis
        const cached = await this.redis.get(this.CACHE_KEY);
        if (cached) {
            const horariosData = JSON.parse(cached);
            return horariosData.map((h) => new Horario_1.Horario(h.id, h.doctorId, h.nombre, h.diaSemana, new Date(h.horaInicio), new Date(h.horaFin), h.ubicacionId, h.estado, new Date(h.creadoEn)));
        }
        // 2. Si no hay caché, buscar en DB
        const horariosOrm = await this.prisma.horario.findMany({
            where: { estado: { equals: 'Activo' } },
            orderBy: [{ doctorId: 'asc' }, { diaSemana: 'asc' }, { horaInicio: 'asc' }]
        });
        // 3. Mapear a Entidad de Dominio
        const horarios = horariosOrm.map(h => this.mapToDomain(h));
        // 4. Guardar en Redis (TTL 24 horas porque esto cambia poco)
        await this.redis.set(this.CACHE_KEY, JSON.stringify(horariosOrm), this.CACHE_TTL);
        return horarios;
    }
    async listarPorDoctor(doctorId) {
        const cacheKey = this.CACHE_KEY_POR_DOCTOR(doctorId);
        // 1. Intentar obtener de Redis
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            const horariosData = JSON.parse(cached);
            return horariosData.map((h) => new Horario_1.Horario(h.id, h.doctorId, h.nombre, h.diaSemana, new Date(h.horaInicio), new Date(h.horaFin), h.ubicacionId, h.estado, new Date(h.creadoEn)));
        }
        // 2. Si no hay caché, buscar en DB
        const horariosOrm = await this.prisma.horario.findMany({
            where: {
                doctorId,
                estado: { equals: 'Activo' }
            },
            orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }]
        });
        // 3. Mapear a Entidad de Dominio
        const horarios = horariosOrm.map(h => this.mapToDomain(h));
        // 4. Guardar en Redis
        await this.redis.set(cacheKey, JSON.stringify(horariosOrm), this.CACHE_TTL);
        return horarios;
    }
    async listarPorDia(diaSemana) {
        const cacheKey = this.CACHE_KEY_POR_DIA(diaSemana);
        // 1. Intentar obtener de Redis
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            const horariosData = JSON.parse(cached);
            return horariosData.map((h) => new Horario_1.Horario(h.id, h.doctorId, h.nombre, h.diaSemana, new Date(h.horaInicio), new Date(h.horaFin), h.ubicacionId, h.estado, new Date(h.creadoEn)));
        }
        // 2. Si no hay caché, buscar en DB
        const horariosOrm = await this.prisma.horario.findMany({
            where: {
                diaSemana,
                estado: { equals: 'Activo' }
            },
            orderBy: [{ doctorId: 'asc' }, { horaInicio: 'asc' }]
        });
        // 3. Mapear a Entidad de Dominio
        const horarios = horariosOrm.map(h => this.mapToDomain(h));
        // 4. Guardar en Redis
        await this.redis.set(cacheKey, JSON.stringify(horariosOrm), this.CACHE_TTL);
        return horarios;
    }
    async buscarPorId(id) {
        const horario = await this.prisma.horario.findUnique({ where: { id } });
        if (!horario)
            return null;
        return this.mapToDomain(horario);
    }
    async actualizar(id, doctorId, nombre, diaSemana, horaInicio, horaFin, ubicacionId, estado) {
        try {
            // Obtener el horario existente para saber qué caché invalidar
            const horarioExistente = await this.prisma.horario.findUnique({
                where: { id }
            });
            if (!horarioExistente) {
                throw new Error(`Horario con ID ${id} no existe`);
            }
            const dataActualizar = {};
            if (doctorId !== undefined)
                dataActualizar.doctor = { connect: { usuarioId: doctorId } };
            if (nombre !== undefined)
                dataActualizar.nombre = nombre.trim();
            if (diaSemana !== undefined)
                dataActualizar.diaSemana = diaSemana;
            if (horaInicio !== undefined)
                dataActualizar.horaInicio = horaInicio;
            if (horaFin !== undefined)
                dataActualizar.horaFin = horaFin;
            if (ubicacionId !== undefined)
                dataActualizar.ubicacion = { connect: { id: ubicacionId } };
            if (estado !== undefined)
                dataActualizar.estado = estado;
            const actualizado = await this.prisma.horario.update({
                where: { id },
                data: dataActualizar
            });
            // INVALIDAR CACHÉ
            await this.redis.del(this.CACHE_KEY);
            // Invalidar caché del doctor anterior (si el doctorId cambió)
            if (doctorId !== undefined && doctorId !== horarioExistente.doctorId) {
                await this.redis.del(this.CACHE_KEY_POR_DOCTOR(horarioExistente.doctorId));
            }
            // Invalidar caché del doctor actual
            await this.redis.del(this.CACHE_KEY_POR_DOCTOR(actualizado.doctorId));
            // Invalidar caché del día anterior (si el diaSemana cambió)
            if (diaSemana !== undefined && diaSemana !== horarioExistente.diaSemana) {
                await this.redis.del(this.CACHE_KEY_POR_DIA(horarioExistente.diaSemana));
            }
            // Invalidar caché del día actual
            await this.redis.del(this.CACHE_KEY_POR_DIA(actualizado.diaSemana));
            return this.mapToDomain(actualizado);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new HorarioConflictoError_1.HorarioConflictoError();
                }
            }
            throw error;
        }
    }
    async eliminar(id) {
        const horarioAEliminar = await this.prisma.horario.findUnique({
            where: { id }
        });
        if (!horarioAEliminar) {
            throw new Error(`Horario con ID ${id} no existe`);
        }
        const eliminado = await this.prisma.horario.update({
            where: { id },
            data: { estado: 'Eliminado' }
        });
        // INVALIDAR CACHÉ
        await this.redis.del(this.CACHE_KEY);
        await this.redis.del(this.CACHE_KEY_POR_DOCTOR(eliminado.doctorId));
        await this.redis.del(this.CACHE_KEY_POR_DIA(eliminado.diaSemana));
        return this.mapToDomain(eliminado);
    }
    async listarPorEstado(estado) {
        const cacheKey = this.CACHE_KEY_POR_ESTADO(estado);
        // 1. Intentar obtener de Redis
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            const horariosData = JSON.parse(cached);
            return horariosData.map((h) => new Horario_1.Horario(h.id, h.doctorId, h.nombre, h.diaSemana, new Date(h.horaInicio), new Date(h.horaFin), h.ubicacionId, h.estado, new Date(h.creadoEn)));
        }
        // 2. Si no hay caché, buscar en DB
        const horariosOrm = await this.prisma.horario.findMany({
            where: { estado },
            orderBy: [{ doctorId: 'asc' }, { diaSemana: 'asc' }, { horaInicio: 'asc' }]
        });
        // 3. Mapear a Entidad de Dominio
        const horarios = horariosOrm.map(h => this.mapToDomain(h));
        // 4. Guardar en Redis
        await this.redis.set(cacheKey, JSON.stringify(horariosOrm), this.CACHE_TTL);
        return horarios;
    }
    async existeConflicto(doctorId, diaSemana, horaInicio, horaFin, excluirId) {
        const conflicto = await this.prisma.horario.findFirst({
            where: {
                doctorId,
                diaSemana,
                estado: { not: 'Eliminado' },
                ...(excluirId ? { NOT: { id: excluirId } } : {}),
                AND: [
                    { horaInicio: { lt: horaFin } },
                    { horaFin: { gt: horaInicio } }
                ]
            },
            select: { id: true }
        });
        return Boolean(conflicto);
    }
    mapToDomain(horario) {
        return new Horario_1.Horario(horario.id, horario.doctorId, horario.nombre, horario.diaSemana, horario.horaInicio, horario.horaFin, horario.ubicacionId, horario.estado, horario.creadoEn);
    }
}
exports.PrismaHorariosRepository = PrismaHorariosRepository;
