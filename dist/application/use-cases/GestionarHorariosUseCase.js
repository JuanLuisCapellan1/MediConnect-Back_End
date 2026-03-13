"use strict";
/**
 * GestionarHorariosUseCase.ts
 * Casos de uso para la gestión de Horarios con diasSemana[]
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GestionarHorariosUseCase = void 0;
class GestionarHorariosUseCase {
    constructor(horariosRepository, horarioValidator, estadoValidator, enviarNotifUC) {
        this.horariosRepository = horariosRepository;
        this.horarioValidator = horarioValidator;
        this.estadoValidator = estadoValidator;
        this.enviarNotifUC = enviarNotifUC;
    }
    async crear(dto) {
        const { horaInicioDate, horaFinDate } = await this.horarioValidator.validarDatosHorario(dto.doctorId, dto.nombre, dto.diasSemana, dto.horaInicio, dto.horaFin);
        return await this.horariosRepository.crear(dto.doctorId, dto.nombre.trim(), dto.diasSemana, horaInicioDate, horaFinDate);
    }
    async listarTodos() {
        return await this.horariosRepository.listarTodos();
    }
    async listarPorDoctor(doctorId) {
        return await this.horariosRepository.listarPorDoctor(doctorId);
    }
    async listarPorDia(diaSemana) {
        return await this.horariosRepository.listarPorDia(diaSemana);
    }
    async buscarPorId(id) {
        return await this.horariosRepository.buscarPorId(id);
    }
    async actualizar(dto) {
        const existente = await this.horariosRepository.buscarPorId(dto.id);
        if (!existente) {
            throw new Error(`Horario con ID ${dto.id} no existe`);
        }
        const doctorId = dto.doctorId ?? existente.doctorId;
        const nombre = dto.nombre ?? existente.nombre;
        const diasSemana = dto.diasSemana ?? existente.dias;
        const horaInicio = dto.horaInicio ?? existente.horaInicio;
        const horaFin = dto.horaFin ?? existente.horaFin;
        if (dto.estado) {
            await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo', 'Eliminado']);
        }
        const { horaInicioDate, horaFinDate } = await this.horarioValidator.validarDatosHorario(doctorId, nombre, diasSemana, horaInicio, horaFin, dto.id);
        return await this.horariosRepository.actualizar(dto.id, dto.doctorId, dto.nombre?.trim(), dto.diasSemana, dto.horaInicio ? horaInicioDate : undefined, dto.horaFin ? horaFinDate : undefined, dto.estado);
    }
    async eliminar(id, doctorId) {
        const horario = await this.horariosRepository.buscarPorId(id);
        if (!horario)
            throw new Error(`Horario con ID ${id} no encontrado`);
        if (horario.doctorId !== doctorId)
            throw new Error('No tienes permiso para eliminar este horario');
        // ─ Buscar pacientes con citas en este horario y notificarles ──────────────
        try {
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
            const prisma = new PrismaClient();
            const citasAfectadas = await prisma.cita.findMany({
                where: {
                    horarioId: id,
                    estado: { in: ['Programada', 'Reprogramada'] },
                },
                select: { id: true, pacienteId: true },
            });
            await prisma.$disconnect();
            for (const cita of citasAfectadas) {
                this.enviarNotifUC.execute({
                    usuarioId: cita.pacienteId,
                    titulo: 'Disponibilidad Médica Modificada',
                    mensaje: 'Tu médico ha actualizado su disponibilidad. Por favor revisa el estado de tu cita.',
                    tipoAlerta: 'Atencion',
                    tipoEntidad: 'Cita',
                    entidadId: cita.id,
                }).catch((e) => console.error('notif eliminarHorario:', e));
            }
        }
        catch (e) {
            console.error('GestionarHorariosUseCase.eliminar: error al notificar:', e);
        }
        return await this.horariosRepository.eliminar(id);
    }
    async listarPorEstado(estado) {
        await this.estadoValidator.validarEstado(estado, ['Activo', 'Inactivo', 'Eliminado']);
        return await this.horariosRepository.listarPorEstado(estado);
    }
    /**
     * Verifica si un conjunto de horarios (por ID) presentan conflictos entre sí.
     */
    async verificarConflictos(horarioIds) {
        if (!horarioIds || horarioIds.length < 2) {
            return {
                conflicto: false,
                mensaje: 'Se necesitan al menos 2 horarios para comparar.',
                detalles: []
            };
        }
        const horarios = [];
        for (const id of horarioIds) {
            const h = await this.horariosRepository.buscarPorId(id);
            if (!h)
                throw new Error('Horario con ID ' + id + ' no encontrado');
            horarios.push(h);
        }
        const DIAS = {
            1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
            4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo'
        };
        const detalles = [];
        for (let i = 0; i < horarios.length; i++) {
            for (let j = i + 1; j < horarios.length; j++) {
                const a = horarios[i];
                const b = horarios[j];
                const diasEnComun = a.dias.filter(d => b.dias.includes(d));
                if (diasEnComun.length === 0)
                    continue;
                const inicioA = this.hhmmmAMinutos(a.horaInicio);
                const finA = this.hhmmmAMinutos(a.horaFin);
                const inicioB = this.hhmmmAMinutos(b.horaInicio);
                const finB = this.hhmmmAMinutos(b.horaFin);
                if (inicioA < finB && finA > inicioB) {
                    const diasStr = diasEnComun.map(d => DIAS[d] ?? d).join(', ');
                    detalles.push({
                        horario1Id: a.id,
                        horario2Id: b.id,
                        diasConflicto: diasEnComun,
                        mensaje: '"' + a.nombre + '" (' + a.horaInicio + '–' + a.horaFin + ') y "' +
                            b.nombre + '" (' + b.horaInicio + '–' + b.horaFin + ') se solapan en: ' + diasStr + '.'
                    });
                }
            }
        }
        if (detalles.length === 0) {
            return {
                conflicto: false,
                mensaje: 'Los horarios seleccionados no presentan conflictos entre sí.',
                detalles: []
            };
        }
        return {
            conflicto: true,
            mensaje: 'Se encontraron ' + detalles.length + ' conflicto(s) entre los horarios seleccionados.',
            detalles
        };
    }
    /** Convierte "HH:mm" a minutos desde medianoche */
    hhmmmAMinutos(hhmm) {
        const [hh, mm] = hhmm.split(':').map(Number);
        return hh * 60 + mm;
    }
}
exports.GestionarHorariosUseCase = GestionarHorariosUseCase;
