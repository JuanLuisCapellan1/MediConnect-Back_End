"use strict";
/**
 * PrismaHorariosRepository.ts
 * Repositorio para Horarios — usa horarios_dias (tabla pivote de días de semana)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaHorariosRepository = void 0;
const client_1 = require("@prisma/client");
const Horario_1 = require("../../domain/entities/Horario");
const HorarioConflictoError_1 = require("../../domain/errors/Horarios/HorarioConflictoError");
const HORARIO_INCLUDE = {
    horarios_dias: { select: { dia_semana: true } }
};
class PrismaHorariosRepository {
    constructor(prisma, redis) {
        this.CACHE_KEY = 'horarios:listado';
        this.CACHE_KEY_POR_DOCTOR = (doctorId) => `horarios:doctor:${doctorId}`;
        this.CACHE_KEY_POR_DIA = (diaSemana) => `horarios:dia:${diaSemana}`;
        this.CACHE_KEY_POR_ESTADO = (estado) => `horarios:estado:${estado}`;
        this.CACHE_TTL = 24 * 60 * 60;
        this.prisma = prisma;
        this.redis = redis;
    }
    async crear(doctorId, nombre, diasSemana, horaInicio, horaFin) {
        try {
            const creado = await this.prisma.horario.create({
                data: {
                    doctorId,
                    nombre: nombre.trim(),
                    horaInicio,
                    horaFin,
                    estado: 'Activo',
                    horarios_dias: {
                        createMany: {
                            data: diasSemana.map(dia => ({ dia_semana: dia }))
                        }
                    }
                },
                include: HORARIO_INCLUDE
            });
            await this.redis.del(this.CACHE_KEY);
            await this.redis.del(this.CACHE_KEY_POR_DOCTOR(doctorId));
            for (const dia of diasSemana) {
                await this.redis.del(this.CACHE_KEY_POR_DIA(dia));
            }
            return this.mapToDomain(creado);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new HorarioConflictoError_1.HorarioConflictoError();
            }
            throw error;
        }
    }
    async listarTodos() {
        const cached = await this.redis.get(this.CACHE_KEY);
        if (cached) {
            return JSON.parse(cached).map(h => this.mapToDomain(h));
        }
        const horariosOrm = await this.prisma.horario.findMany({
            where: { estado: { equals: 'Activo' } },
            include: HORARIO_INCLUDE,
            orderBy: [{ doctorId: 'asc' }, { horaInicio: 'asc' }]
        });
        await this.redis.set(this.CACHE_KEY, JSON.stringify(horariosOrm), this.CACHE_TTL);
        return horariosOrm.map((h) => this.mapToDomain(h));
    }
    async listarPorDoctor(doctorId) {
        const cacheKey = this.CACHE_KEY_POR_DOCTOR(doctorId);
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached).map(h => this.mapToDomain(h));
        }
        const horariosOrm = await this.prisma.horario.findMany({
            where: { doctorId, estado: { equals: 'Activo' } },
            include: HORARIO_INCLUDE,
            orderBy: [{ horaInicio: 'asc' }]
        });
        await this.redis.set(cacheKey, JSON.stringify(horariosOrm), this.CACHE_TTL);
        return horariosOrm.map((h) => this.mapToDomain(h));
    }
    async listarPorDia(diaSemana) {
        const cacheKey = this.CACHE_KEY_POR_DIA(diaSemana);
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached).map(h => this.mapToDomain(h));
        }
        const horariosOrm = await this.prisma.horario.findMany({
            where: {
                estado: { equals: 'Activo' },
                horarios_dias: { some: { dia_semana: diaSemana } }
            },
            include: HORARIO_INCLUDE,
            orderBy: [{ doctorId: 'asc' }, { horaInicio: 'asc' }]
        });
        await this.redis.set(cacheKey, JSON.stringify(horariosOrm), this.CACHE_TTL);
        return horariosOrm.map((h) => this.mapToDomain(h));
    }
    async buscarPorId(id) {
        const horario = await this.prisma.horario.findUnique({
            where: { id },
            include: HORARIO_INCLUDE
        });
        if (!horario)
            return null;
        return this.mapToDomain(horario);
    }
    async actualizar(id, doctorId, nombre, diasSemana, horaInicio, horaFin, estado) {
        try {
            const horarioExistente = await this.prisma.horario.findUnique({ where: { id } });
            if (!horarioExistente) {
                throw new Error(`Horario con ID ${id} no existe`);
            }
            const dataActualizar = {};
            if (doctorId !== undefined)
                dataActualizar.doctor = { connect: { usuarioId: doctorId } };
            if (nombre !== undefined)
                dataActualizar.nombre = nombre.trim();
            if (horaInicio !== undefined)
                dataActualizar.horaInicio = horaInicio;
            if (horaFin !== undefined)
                dataActualizar.horaFin = horaFin;
            if (estado !== undefined)
                dataActualizar.estado = estado;
            // Si se actualizan días: reemplazar todos los registros de horarios_dias
            if (diasSemana !== undefined) {
                dataActualizar.horarios_dias = {
                    deleteMany: {},
                    createMany: {
                        data: diasSemana.map(dia => ({ dia_semana: dia }))
                    }
                };
            }
            const actualizado = await this.prisma.horario.update({
                where: { id },
                data: dataActualizar,
                include: HORARIO_INCLUDE
            });
            // Invalidar caché
            await this.redis.del(this.CACHE_KEY);
            await this.redis.del(this.CACHE_KEY_POR_DOCTOR(actualizado.doctorId));
            if (doctorId !== undefined && doctorId !== horarioExistente.doctorId) {
                await this.redis.del(this.CACHE_KEY_POR_DOCTOR(horarioExistente.doctorId));
            }
            return this.mapToDomain(actualizado);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new HorarioConflictoError_1.HorarioConflictoError();
            }
            throw error;
        }
    }
    async eliminar(id) {
        const horarioAEliminar = await this.prisma.horario.findUnique({
            where: { id },
            include: HORARIO_INCLUDE
        });
        if (!horarioAEliminar) {
            throw new Error(`Horario con ID ${id} no existe`);
        }
        const eliminado = await this.prisma.horario.update({
            where: { id },
            data: { estado: 'Eliminado' },
            include: HORARIO_INCLUDE
        });
        await this.redis.del(this.CACHE_KEY);
        await this.redis.del(this.CACHE_KEY_POR_DOCTOR(eliminado.doctorId));
        return this.mapToDomain(eliminado);
    }
    async listarPorEstado(estado) {
        const cacheKey = this.CACHE_KEY_POR_ESTADO(estado);
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached).map(h => this.mapToDomain(h));
        }
        const horariosOrm = await this.prisma.horario.findMany({
            where: { estado },
            include: HORARIO_INCLUDE,
            orderBy: [{ doctorId: 'asc' }, { horaInicio: 'asc' }]
        });
        await this.redis.set(cacheKey, JSON.stringify(horariosOrm), this.CACHE_TTL);
        return horariosOrm.map((h) => this.mapToDomain(h));
    }
    /**
     * Verifica conflicto de horario para el doctor en cualquiera de los días dados.
     * Conflicto = misma hora (solapamiento) en al menos uno de los diasSemana.
     */
    async existeConflicto(doctorId, diasSemana, horaInicio, horaFin, excluirId) {
        const conflicto = await this.prisma.horario.findFirst({
            where: {
                doctorId,
                estado: { not: 'Eliminado' },
                ...(excluirId ? { NOT: { id: excluirId } } : {}),
                horarios_dias: { some: { dia_semana: { in: diasSemana } } },
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
        const dias = (horario.horarios_dias ?? []).map((d) => d.dia_semana).sort((a, b) => a - b);
        return new Horario_1.Horario(horario.id, horario.doctorId, horario.nombre, this.dateAHHMM(horario.horaInicio), this.dateAHHMM(horario.horaFin), horario.estado, horario.creadoEn, dias);
    }
    /** Convierte un Date (o string ISO) al formato "HH:mm" */
    dateAHHMM(value) {
        if (!value)
            return '';
        const d = value instanceof Date ? value : new Date(value);
        const hh = String(d.getUTCHours()).padStart(2, '0');
        const mm = String(d.getUTCMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
    }
}
exports.PrismaHorariosRepository = PrismaHorariosRepository;
