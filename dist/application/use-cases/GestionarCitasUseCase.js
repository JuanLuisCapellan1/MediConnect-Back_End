"use strict";
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GestionarCitasUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const EnviarNotificacionUseCase_1 = require("./notificaciones/EnviarNotificacionUseCase");
let GestionarCitasUseCase = class GestionarCitasUseCase {
    constructor(citaRepo, doctorRepo, pacienteRepo, inactividadRepo, enviarNotifUC) {
        this.citaRepo = citaRepo;
        this.doctorRepo = doctorRepo;
        this.pacienteRepo = pacienteRepo;
        this.inactividadRepo = inactividadRepo;
        this.enviarNotifUC = enviarNotifUC;
    }
    // ===================================================================
    // Helper: combina una fecha "YYYY-MM-DD" y una hora "HH:MM" en Date UTC
    // ===================================================================
    _combinarFechaHora(fecha, hora) {
        return new Date(`${fecha}T${hora}:00.000Z`);
    }
    // ===================================================================
    // Helper: aplica la hora de un horario (DateTime con solo hora)
    // sobre una fecha base concreta.
    // ===================================================================
    _aplicarHoraEnFecha(fechaBase, horaRef) {
        const result = new Date(fechaBase);
        result.setUTCHours(horaRef.getUTCHours(), horaRef.getUTCMinutes(), 0, 0);
        return result;
    }
    // ===================================================================
    // Helper: retorna el día de la semana como número 0-6
    // (0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado)
    // Mismo convenio que JavaScript nativo y que horarios_dias.dia_semana
    // ===================================================================
    _diaSemana(fecha) {
        return fecha.getUTCDay();
    }
    // ===================================================================
    // Helper: valida formato "YYYY-MM-DD"
    // ===================================================================
    _validarFecha(fecha) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            throw new Error('El campo "fecha" debe tener formato YYYY-MM-DD (ej: "2026-03-10").');
        }
    }
    // ===================================================================
    // Helper: valida formato "HH:MM"
    // ===================================================================
    _validarHora(hora) {
        if (!/^\d{2}:\d{2}$/.test(hora)) {
            throw new Error('El campo "hora" debe tener formato HH:MM en UTC (ej: "09:00").');
        }
    }
    // ===================================================================
    // PACIENTE: Consultar slots disponibles de un servicio en una fecha
    // GET /servicios/:id/slots?fecha=YYYY-MM-DD
    // ===================================================================
    async obtenerSlotsDisponibles(servicioId, fecha) {
        this._validarFecha(fecha);
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        try {
            const servicio = await prisma.servicio.findUnique({
                where: { id: servicioId },
                include: {
                    horarios: {
                        where: { estado: 'Activo' },
                        include: {
                            horario: {
                                include: { horarios_dias: { select: { dia_semana: true } } },
                            },
                        },
                    },
                },
            });
            if (!servicio || servicio.estado !== 'Activo') {
                throw new Error('El servicio no existe o no está disponible.');
            }
            const fechaBase = new Date(`${fecha}T00:00:00.000Z`);
            const diaRequerido = this._diaSemana(fechaBase);
            const duracion = servicio.duracionMinutos ?? 30;
            const slots = [];
            for (const sh of servicio.horarios) {
                const horario = sh.horario;
                const diasDelHorario = horario.horarios_dias.map((d) => d.dia_semana);
                if (!diasDelHorario.includes(diaRequerido))
                    continue;
                const horaInicioHorario = new Date(horario.horaInicio);
                const horaFinHorario = new Date(horario.horaFin);
                let cursor = this._aplicarHoraEnFecha(fechaBase, horaInicioHorario);
                const limite = this._aplicarHoraEnFecha(fechaBase, horaFinHorario);
                while (cursor.getTime() + duracion * 60 * 1000 <= limite.getTime()) {
                    const slotInicio = new Date(cursor);
                    const slotFin = new Date(cursor.getTime() + duracion * 60 * 1000);
                    const citasConflicto = await this.citaRepo.obtenerCitasEnRango(servicio.doctorId, slotInicio, slotFin);
                    const inactividades = await this.inactividadRepo.buscarSolapantes(servicio.doctorId, slotInicio, slotFin);
                    // Formato legible HH:MM
                    const horaInicioStr = slotInicio.toISOString().substring(11, 16);
                    const horaFinStr = slotFin.toISOString().substring(11, 16);
                    slots.push({
                        horarioId: horario.id,
                        horarioNombre: horario.nombre ?? null,
                        fecha,
                        horaInicio: horaInicioStr,
                        horaFin: horaFinStr,
                        horaInicioISO: slotInicio.toISOString(),
                        horaFinISO: slotFin.toISOString(),
                        disponible: citasConflicto.length === 0 && inactividades.length === 0,
                    });
                    cursor = new Date(slotFin);
                }
            }
            return slots;
        }
        finally {
            await prisma.$disconnect();
        }
    }
    // ===================================================================
    // PÚBLICO: Solo los slots DISPONIBLES de un servicio para una fecha
    // GET /servicios/:id/slots-disponibles?fecha=YYYY-MM-DD
    // ===================================================================
    async slotsDisponiblesParaServicio(servicioId, fecha) {
        this._validarFecha(fecha);
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        try {
            const servicio = await prisma.servicio.findUnique({
                where: { id: servicioId },
                include: {
                    horarios: {
                        where: { estado: 'Activo' },
                        include: {
                            horario: {
                                include: { horarios_dias: { select: { dia_semana: true } } },
                            },
                        },
                    },
                },
            });
            if (!servicio || servicio.estado !== 'Activo') {
                throw new Error('El servicio no existe o no está disponible.');
            }
            const fechaBase = new Date(`${fecha}T00:00:00.000Z`);
            const diaRequerido = this._diaSemana(fechaBase);
            const duracion = servicio.duracionMinutos ?? 30;
            // Prefetch citas e inactividades del día completo
            const diaFin = new Date(fechaBase.getTime() + 24 * 60 * 60 * 1000);
            const citasDelDia = await this.citaRepo.obtenerCitasEnRango(servicio.doctorId, fechaBase, diaFin);
            const inactividades = await this.inactividadRepo.buscarSolapantes(servicio.doctorId, fechaBase, diaFin);
            // Helper: formato 12h "10:00 a.m." / "2:30 p.m."
            const formatear12h = (hhmm) => {
                const [hh, mm] = hhmm.split(':').map(Number);
                const periodo = hh < 12 ? 'a.m.' : 'p.m.';
                const hora12 = hh % 12 === 0 ? 12 : hh % 12;
                return `${hora12}:${mm.toString().padStart(2, '0')} ${periodo}`;
            };
            const disponibles = [];
            for (const sh of servicio.horarios) {
                const horario = sh.horario;
                const diasDelHorario = horario.horarios_dias.map((d) => d.dia_semana);
                if (!diasDelHorario.includes(diaRequerido))
                    continue;
                const horaInicioRef = new Date(horario.horaInicio);
                const horaFinRef = new Date(horario.horaFin);
                let cursor = this._aplicarHoraEnFecha(fechaBase, horaInicioRef);
                const limite = this._aplicarHoraEnFecha(fechaBase, horaFinRef);
                while (cursor.getTime() + duracion * 60 * 1000 <= limite.getTime()) {
                    const slotIni = cursor.getTime();
                    const slotFin = slotIni + duracion * 60 * 1000;
                    const conflictoCita = citasDelDia.some(c => {
                        const cIni = new Date(c.fechaInicio).getTime();
                        const cFin = c.fechaFin
                            ? new Date(c.fechaFin).getTime()
                            : cIni + duracion * 60 * 1000;
                        return cIni < slotFin && cFin > slotIni;
                    });
                    const conflictoInac = inactividades.some(p => {
                        const pIni = new Date(p.fechaInicio).getTime();
                        const pFin = new Date(p.fechaFin).getTime();
                        return pIni < slotFin && pFin > slotIni;
                    });
                    if (!conflictoCita && !conflictoInac) {
                        const horaInicioStr = new Date(slotIni).toISOString().substring(11, 16);
                        const horaFinStr = new Date(slotFin).toISOString().substring(11, 16);
                        disponibles.push({
                            horaInicio: horaInicioStr,
                            horaFin: horaFinStr,
                            horaInicioFormateada: formatear12h(horaInicioStr),
                            horarioId: horario.id,
                            horarioNombre: horario.nombre ?? null,
                        });
                    }
                    cursor = new Date(slotFin);
                }
            }
            return disponibles;
        }
        finally {
            await prisma.$disconnect();
        }
    }
    // ===================================================================
    // PACIENTE: Agendar cita
    // ===================================================================
    async agendarCita(pacienteId, dto) {
        this._validarFecha(dto.fecha);
        this._validarHora(dto.hora);
        const fechaInicio = this._combinarFechaHora(dto.fecha, dto.hora);
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        try {
            const servicio = await prisma.servicio.findUnique({
                where: { id: dto.servicioId },
                include: {
                    doctor: {
                        include: {
                            segurosAceptados: { where: { estado: 'Activo' } },
                        },
                    },
                    horarios: {
                        where: { estado: 'Activo' },
                        include: {
                            horario: {
                                include: { horarios_dias: { select: { dia_semana: true } } },
                            },
                        },
                    },
                },
            });
            if (!servicio || servicio.estado !== 'Activo') {
                throw new Error('El servicio no existe o no está disponible.');
            }
            const doctorId = servicio.doctorId;
            // 1. Validar que el horario pertenece al servicio
            const horarioVinculado = servicio.horarios.find((sh) => sh.horarioId === dto.horarioId);
            if (!horarioVinculado) {
                throw new Error('El horario seleccionado no está disponible para este servicio.');
            }
            const horario = horarioVinculado.horario;
            const diasDelHorario = horario.horarios_dias.map((d) => d.dia_semana);
            // 2. Validar día de semana
            const diaSolicitado = this._diaSemana(fechaInicio);
            if (!diasDelHorario.includes(diaSolicitado)) {
                throw new Error('El servicio no está disponible ese día de la semana.');
            }
            // 3. Validar franja horaria
            const horaInicioHorario = this._aplicarHoraEnFecha(fechaInicio, new Date(horario.horaInicio));
            const horaFinHorario = this._aplicarHoraEnFecha(fechaInicio, new Date(horario.horaFin));
            const duracion = servicio.duracionMinutos ?? 30;
            const fechaFinEstimada = new Date(fechaInicio.getTime() + duracion * 60 * 1000);
            if (fechaInicio < horaInicioHorario || fechaFinEstimada > horaFinHorario) {
                throw new Error(`La hora seleccionada está fuera del horario del servicio ` +
                    `(${horario.horaInicio?.toISOString().substring(11, 16)} – ` +
                    `${horario.horaFin?.toISOString().substring(11, 16)} UTC).`);
            }
            // 4. Validar periodo de inactividad
            const inactividades = await this.inactividadRepo.buscarSolapantes(doctorId, fechaInicio, fechaFinEstimada);
            if (inactividades.length > 0) {
                throw new Error('El doctor no está disponible en esa franja horaria (periodo de inactividad).');
            }
            // 5. Validar conflicto con otras citas del doctor
            const conflictos = await this.citaRepo.obtenerCitasEnRango(doctorId, fechaInicio, fechaFinEstimada);
            if (conflictos.length > 0) {
                throw new Error('El doctor ya tiene una cita programada en ese horario. ' +
                    'Usa GET /servicios/:id/slots?fecha=YYYY-MM-DD para ver los slots disponibles.');
            }
            // 6. Validar seguro (ambos campos son opcionales; si se envía uno, se requiere el otro)
            const tieneSeguroId = dto.seguroId != null;
            const tieneTipoSeguroId = dto.tipoSeguroId != null;
            if (tieneSeguroId !== tieneTipoSeguroId) {
                throw new Error('Para agendar con seguro debes enviar tanto "seguroId" como "tipoSeguroId". ' +
                    'Si no usas seguro, omite ambos campos.');
            }
            if (tieneSeguroId && tieneTipoSeguroId) {
                const pacienteSeguro = await prisma.pacienteSeguro.findFirst({
                    where: {
                        pacienteId,
                        seguroId: dto.seguroId,
                        tipoSeguroId: dto.tipoSeguroId,
                        estado: 'Activo',
                    },
                });
                if (!pacienteSeguro) {
                    throw new Error('El paciente no tiene el seguro seleccionado activo.');
                }
                const doctorSeguro = await prisma.doctorSeguro.findFirst({
                    where: { doctorId, seguroId: dto.seguroId, estado: 'Activo' },
                });
                if (!doctorSeguro) {
                    throw new Error('El doctor no acepta el seguro seleccionado.');
                }
            }
            // Si ninguno se envía, la cita se agenda sin seguro (seguroId y tipoSeguroId quedan null)
            // 7. Calcular total y crear cita
            const numPacientes = dto.numPacientes ?? 1;
            const totalAPagar = parseFloat(servicio.precio.toString()) * numPacientes;
            const citaCreada = await this.citaRepo.crear({
                pacienteId,
                doctorId,
                servicioId: dto.servicioId,
                horarioId: dto.horarioId,
                fechaInicio,
                duracionMinutos: servicio.duracionMinutos ?? 30,
                modalidad: dto.modalidad,
                numPacientes,
                seguroId: dto.seguroId,
                tipoSeguroId: dto.tipoSeguroId,
                motivoConsulta: dto.motivoConsulta,
                totalAPagar,
            });
            // — Notificar al doctor en tiempo real —
            this.enviarNotifUC.execute({
                usuarioId: doctorId,
                titulo: 'Nueva Cita Agendada',
                mensaje: 'Un paciente ha agendado una nueva cita contigo.',
                tipoAlerta: 'Informacion',
                tipoEntidad: 'Cita',
                entidadId: citaCreada.id,
            }).catch((e) => console.error('notif agendarCita:', e));
            return citaCreada;
        }
        finally {
            await prisma.$disconnect();
        }
    }
    // ===================================================================
    // PACIENTE: Listar sus citas
    // ===================================================================
    async listarCitasPaciente(pacienteId, filtros) {
        return await this.citaRepo.listarPorPaciente(pacienteId, {
            estado: filtros.estado,
            pagina: filtros.pagina,
            limite: filtros.limite,
            fechaDesde: filtros.fechaDesde ? new Date(filtros.fechaDesde) : undefined,
            fechaHasta: filtros.fechaHasta ? new Date(filtros.fechaHasta) : undefined,
        });
    }
    // ===================================================================
    // DOCTOR: Listar sus citas
    // ===================================================================
    async listarCitasDoctor(doctorId, filtros) {
        return await this.citaRepo.listarPorDoctor(doctorId, {
            estado: filtros.estado,
            pagina: filtros.pagina,
            limite: filtros.limite,
            fechaDesde: filtros.fechaDesde ? new Date(filtros.fechaDesde) : undefined,
            fechaHasta: filtros.fechaHasta ? new Date(filtros.fechaHasta) : undefined,
        });
    }
    // ===================================================================
    // AMBOS: Detalle de una cita
    // ===================================================================
    async obtenerDetalleCita(citaId, usuarioId, rol) {
        const cita = await this.citaRepo.buscarPorId(citaId);
        if (!cita)
            throw new Error('Cita no encontrada.');
        if (rol === 'Paciente' && cita.pacienteId !== usuarioId) {
            throw new Error('No tienes permisos para ver esta cita.');
        }
        if (rol === 'Doctor' && cita.doctorUsuarioId !== usuarioId) {
            throw new Error('No tienes permisos para ver esta cita.');
        }
        // Obtener historial si existe
        const historial = await this.citaRepo.buscarHistorialPorCita(citaId);
        return {
            cita,
            historial: historial || null,
        };
    }
    // ===================================================================
    // PACIENTE: Editar cita (solo si Programada)
    // ===================================================================
    async editarCita(citaId, pacienteId, dto) {
        const cita = await this.citaRepo.buscarPorId(citaId);
        if (!cita)
            throw new Error('Cita no encontrada.');
        if (cita.pacienteId !== pacienteId) {
            throw new Error('No tienes permisos para editar esta cita.');
        }
        if (cita.estado !== 'Programada') {
            throw new Error('Solo puedes editar citas en estado Programada.');
        }
        const actualizacion = {};
        // fechaInicio: cita.fechaInicio ya viene como "YYYY-MM-DD" y cita.horaInicio como "HH:MM"
        // gracias al mapper _mapCita en el repositorio.
        const fechaActual = typeof cita.fechaInicio === 'string'
            ? cita.fechaInicio // "YYYY-MM-DD" del mapper
            : new Date(cita.fechaInicio).toISOString().substring(0, 10);
        const horaActual = typeof cita.horaInicio === 'string'
            ? cita.horaInicio // "HH:MM" del mapper
            : new Date(cita.fechaInicio).toISOString().substring(11, 16);
        // Combinar fecha+hora si se envían, y recalcular fechaFin automáticamente
        const fechaCambia = dto.fecha !== undefined || dto.hora !== undefined;
        const servicioCambia = dto.servicioId !== undefined;
        if (fechaCambia || servicioCambia) {
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
            const prisma = new PrismaClient();
            try {
                const servicioId = dto.servicioId ?? cita.servicioId;
                const servicio = await prisma.servicio.findUnique({ where: { id: servicioId } });
                if (!servicio)
                    throw new Error('Servicio no encontrado.');
                if (fechaCambia) {
                    const fecha = dto.fecha ?? fechaActual;
                    const hora = dto.hora ?? horaActual;
                    if (dto.fecha)
                        this._validarFecha(dto.fecha);
                    if (dto.hora)
                        this._validarHora(dto.hora);
                    actualizacion.fechaInicio = this._combinarFechaHora(fecha, hora);
                }
                // Recalcular fechaFin siempre que cambie fecha o servicio
                const nuevaFechaInicio = actualizacion.fechaInicio
                    ?? this._combinarFechaHora(fechaActual, horaActual);
                const duracion = servicio.duracionMinutos ?? 30;
                actualizacion.fechaFin = new Date(new Date(nuevaFechaInicio).getTime() + duracion * 60 * 1000);
                // Recalcular precio si cambia servicio o numPacientes
                if (dto.servicioId !== undefined)
                    actualizacion.servicioId = dto.servicioId;
                const numPacientes = dto.numPacientes ?? cita.numPacientes ?? 1;
                actualizacion.totalAPagar = parseFloat(servicio.precio.toString()) * numPacientes;
            }
            finally {
                await prisma.$disconnect();
            }
        }
        else if (dto.numPacientes !== undefined) {
            // Solo cambio de numPacientes sin cambio de servicio/fecha
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
            const prisma = new PrismaClient();
            try {
                const servicio = await prisma.servicio.findUnique({ where: { id: cita.servicioId } });
                if (!servicio)
                    throw new Error('Servicio no encontrado.');
                actualizacion.totalAPagar = parseFloat(servicio.precio.toString()) * dto.numPacientes;
            }
            finally {
                await prisma.$disconnect();
            }
        }
        if (dto.horarioId !== undefined)
            actualizacion.horarioId = dto.horarioId;
        if (dto.modalidad !== undefined)
            actualizacion.modalidad = dto.modalidad;
        if (dto.numPacientes !== undefined)
            actualizacion.numPacientes = dto.numPacientes;
        if (dto.seguroId !== undefined)
            actualizacion.seguroId = dto.seguroId;
        if (dto.tipoSeguroId !== undefined)
            actualizacion.tipoSeguroId = dto.tipoSeguroId;
        if (dto.motivoConsulta !== undefined)
            actualizacion.motivoConsulta = dto.motivoConsulta;
        return await this.citaRepo.actualizar(citaId, actualizacion);
    }
    // ===================================================================
    // AMBOS: Cancelar cita
    // ===================================================================
    async cancelarCita(citaId, usuarioId, rol, dto) {
        const cita = await this.citaRepo.buscarPorId(citaId);
        if (!cita)
            throw new Error('Cita no encontrada.');
        if (rol === 'Paciente' && cita.pacienteId !== usuarioId) {
            throw new Error('No tienes permisos para cancelar esta cita.');
        }
        if (rol === 'Doctor' && cita.doctorUsuarioId !== usuarioId) {
            throw new Error('No tienes permisos para cancelar esta cita.');
        }
        if (!['Programada', 'Reprogramada'].includes(cita.estado)) {
            throw new Error('Solo se pueden cancelar citas en estado Programada o Reprogramada.');
        }
        if (!dto.motivoCancelacion?.trim()) {
            throw new Error('El motivo de cancelación es requerido.');
        }
        const citaCancelada = await this.citaRepo.actualizar(citaId, {
            estado: 'Cancelada',
            motivoCancelacion: dto.motivoCancelacion,
        });
        // — Notificar al otro participante —
        const destinatarioId = rol === 'Paciente' ? cita.doctorUsuarioId : cita.pacienteId;
        this.enviarNotifUC.execute({
            usuarioId: destinatarioId,
            titulo: 'Cita Cancelada',
            mensaje: 'La cita programada ha sido cancelada.',
            tipoAlerta: 'Advertencia',
            tipoEntidad: 'Cita',
            entidadId: citaId,
        }).catch((e) => console.error('notif cancelarCita:', e));
        return citaCancelada;
    }
    // ===================================================================
    // DOCTOR: Reprogramar cita (fecha + hora separadas)
    // ===================================================================
    async reprogramarCita(citaId, doctorId, dto) {
        this._validarFecha(dto.fecha);
        this._validarHora(dto.hora);
        const cita = await this.citaRepo.buscarPorId(citaId);
        if (!cita)
            throw new Error('Cita no encontrada.');
        if (cita.doctorUsuarioId !== doctorId) {
            throw new Error('No tienes permisos para reprogramar esta cita.');
        }
        if (!['Programada', 'Reprogramada'].includes(cita.estado)) {
            throw new Error('Solo se pueden reprogramar citas en estado Programada o Reprogramada.');
        }
        const nuevaFechaInicio = this._combinarFechaHora(dto.fecha, dto.hora);
        const citaReprogramada = await this.citaRepo.actualizar(citaId, {
            horarioId: dto.horarioId,
            fechaInicio: nuevaFechaInicio,
            fechaFin: null,
            estado: 'Reprogramada',
        });
        // — Notificar al paciente (solo el doctor puede reprogramar) —
        this.enviarNotifUC.execute({
            usuarioId: cita.pacienteId,
            titulo: 'Cita Reprogramada',
            mensaje: 'La fecha/hora de tu cita ha sido modificada.',
            tipoAlerta: 'Atencion',
            tipoEntidad: 'Cita',
            entidadId: citaId,
        }).catch((e) => console.error('notif reprogramarCita:', e));
        return citaReprogramada;
    }
    // ===================================================================
    // DOCTOR: Diagnosticar (marca fechaFin=now y completa la cita)
    // ===================================================================
    async diagnosticarCita(citaId, doctorId, dto) {
        const cita = await this.citaRepo.buscarPorId(citaId);
        if (!cita)
            throw new Error('Cita no encontrada.');
        if (cita.doctorUsuarioId !== doctorId) {
            throw new Error('No tienes permisos para diagnosticar esta cita.');
        }
        if (!['Programada', 'En Progreso', 'Reprogramada', 'En curso'].includes(cita.estado)) {
            throw new Error('Solo puedes diagnosticar citas en estado Programada, En Progreso, Reprogramada o En curso.');
        }
        const historialExistente = await this.citaRepo.buscarHistorialPorCita(citaId);
        let historial;
        if (historialExistente) {
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
            const prisma = new PrismaClient();
            historial = await prisma.historialConsulta.update({
                where: { citaId },
                data: {
                    resumen: dto.resumen,
                    diagnostico: dto.diagnostico,
                    tratamiento: dto.tratamiento,
                    observacion: dto.observacion,
                    actualizadoEn: new Date(),
                },
            });
            await prisma.$disconnect();
        }
        else {
            historial = await this.citaRepo.crearHistorial({
                citaId,
                pacienteId: cita.pacienteId,
                resumen: dto.resumen,
                diagnostico: dto.diagnostico,
                tratamiento: dto.tratamiento,
                observacion: dto.observacion,
            });
        }
        // Calcular fechaFin como fechaInicio + duración del servicio.
        // Combinar fecha (YYYY-MM-DD) y hora (HH:MM) para obtener una fecha válida
        const fechaCompleta = `${cita.fechaInicio}T${cita.horaInicio}:00.000Z`;
        const fechaInicioDate = new Date(fechaCompleta);
        const duracionMs = (cita.servicio?.duracionMinutos ?? 30) * 60 * 1000;
        const fechaFin = new Date(fechaInicioDate.getTime() + duracionMs);
        await this.citaRepo.actualizar(citaId, {
            estado: 'Completada',
            fechaFin,
        });
        // ─ Notificar al paciente que su historial/diagnóstico está disponible ─
        this.enviarNotifUC.execute({
            usuarioId: cita.pacienteId,
            titulo: 'Historial Médico Actualizado',
            mensaje: 'El doctor ha cerrado tu consulta y registrado el diagnóstico. Ya puedes verlo en tu historial.',
            tipoAlerta: 'Exito',
            tipoEntidad: 'Cita',
            entidadId: citaId,
        }).catch((e) => console.error('notif diagnosticarCita:', e));
        return historial;
    }
    // ===================================================================
    // PACIENTE / DOCTOR: Historial de una cita específica
    // ===================================================================
    async obtenerHistorialCita(citaId, usuarioId, rol) {
        const cita = await this.citaRepo.buscarPorId(citaId);
        if (!cita)
            throw new Error('Cita no encontrada.');
        if (rol === 'Paciente' && cita.pacienteId !== usuarioId) {
            throw new Error('No tienes permisos para ver el historial de esta cita.');
        }
        if (rol === 'Doctor' && cita.doctorUsuarioId !== usuarioId) {
            throw new Error('No tienes permisos para ver el historial de esta cita.');
        }
        const historial = await this.citaRepo.buscarHistorialPorCita(citaId);
        if (!historial)
            throw new Error('Esta cita no tiene historial aún.');
        return historial;
    }
    // ===================================================================
    // PACIENTE: Historial completo de consultas
    // ===================================================================
    async obtenerHistorialPaciente(pacienteId, filtros) {
        return await this.citaRepo.listarHistorialPaciente(pacienteId, filtros);
    }
    // ===================================================================
    // DOCTOR: Registrar periodo de inactividad
    // ===================================================================
    async registrarInactividad(doctorId, dto) {
        this._validarFecha(dto.fechaInicio);
        this._validarFecha(dto.fechaFin);
        const horaInicio = dto.horaInicio ?? '00:00';
        const horaFin = dto.horaFin ?? '23:59';
        if (dto.horaInicio)
            this._validarHora(dto.horaInicio);
        if (dto.horaFin)
            this._validarHora(dto.horaFin);
        const fechaInicio = this._combinarFechaHora(dto.fechaInicio, horaInicio);
        const fechaFin = this._combinarFechaHora(dto.fechaFin, horaFin);
        if (fechaFin <= fechaInicio) {
            throw new Error('La fecha/hora de fin debe ser posterior a la fecha/hora de inicio.');
        }
        const periodo = await this.inactividadRepo.crear({
            doctorId,
            fechaInicio,
            fechaFin,
            motivo: dto.motivo,
        });
        const citasAfectadas = await this.citaRepo.obtenerCitasEnRango(doctorId, fechaInicio, fechaFin);
        const motivoCancelacion = `Doctor registró período de inactividad${dto.motivo ? ': ' + dto.motivo : '.'}`;
        let citasCanceladas = 0;
        for (const cita of citasAfectadas) {
            if (['Programada', 'Reprogramada'].includes(cita.estado)) {
                await this.citaRepo.actualizar(cita.id, {
                    estado: 'Cancelada',
                    motivoCancelacion,
                });
                citasCanceladas++;
                // ─ Notificar al paciente de cada cita cancelada ─────────────
                this.enviarNotifUC.execute({
                    usuarioId: cita.pacienteId,
                    titulo: 'Cita Cancelada por Indisponibilidad',
                    mensaje: `Tu cita fue cancelada porque el doctor registró un período de inactividad.${dto.motivo ? ' Motivo: ' + dto.motivo : ''}`,
                    tipoAlerta: 'Advertencia',
                    tipoEntidad: 'Cita',
                    entidadId: cita.id,
                }).catch((e) => console.error('notif registrarInactividad:', e));
            }
        }
        return { periodo, citasCanceladas };
    }
    // ===================================================================
    // DOCTOR: Cancelar un periodo de inactividad propio
    // ===================================================================
    async cancelarInactividad(periodoId, doctorId) {
        const periodo = await this.inactividadRepo.buscarPorId(periodoId);
        if (!periodo)
            throw new Error('Periodo de inactividad no encontrado.');
        if (periodo.id_doctor !== doctorId) {
            throw new Error('No tienes permisos para cancelar este periodo.');
        }
        if (periodo.estado !== 'Activo') {
            throw new Error('Este periodo ya fue cancelado.');
        }
        return await this.inactividadRepo.cancelar(periodoId);
    }
    // ===================================================================
    // PÚBLICO: Disponibilidad de un doctor — resumen por día
    // GET /servicios/doctor/:doctorId/disponibilidad?dias=7&fechaInicio=YYYY-MM-DD
    // ===================================================================
    async disponibilidadDoctor(doctorId, dias, fechaInicioStr) {
        if (dias < 1 || dias > 30) {
            throw new Error('El parámetro "dias" debe estar entre 1 y 30.');
        }
        if (fechaInicioStr)
            this._validarFecha(fechaInicioStr);
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        try {
            // 1. Verificar que el doctor existe
            const doctor = await prisma.doctor.findUnique({ where: { usuarioId: doctorId } });
            if (!doctor)
                throw new Error('El doctor no existe.');
            // 2. Cargar todos los servicios activos con sus horarios
            const servicios = await prisma.servicio.findMany({
                where: { doctorId, estado: 'Activo' },
                include: {
                    horarios: {
                        where: { estado: 'Activo' },
                        include: {
                            horario: {
                                include: { horarios_dias: { select: { dia_semana: true } } },
                            },
                        },
                    },
                },
            });
            // 3. Determinar rango de fechas completo
            const hoy = fechaInicioStr
                ? new Date(`${fechaInicioStr}T00:00:00.000Z`)
                : new Date(new Date().toISOString().substring(0, 10) + 'T00:00:00.000Z');
            const ultimoDia = new Date(hoy.getTime() + (dias - 1) * 24 * 60 * 60 * 1000);
            const rangoFin = new Date(ultimoDia.getTime() + 24 * 60 * 60 * 1000); // día siguiente (exclusivo)
            // 4. Prefetch: TODAS las citas del doctor en el rango (una sola query)
            const todasLasCitas = await this.citaRepo.obtenerCitasEnRango(doctorId, hoy, rangoFin);
            // 5. Prefetch: TODOS los periodos de inactividad solapantes
            const todasLasInactividades = await this.inactividadRepo.buscarSolapantes(doctorId, hoy, rangoFin);
            // Abreviaturas en español
            const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const resultado = [];
            // 6. Iterar día a día
            for (let i = 0; i < dias; i++) {
                const fechaBase = new Date(hoy.getTime() + i * 24 * 60 * 60 * 1000);
                const fechaStr = fechaBase.toISOString().substring(0, 10);
                const diaNum = fechaBase.getUTCDay();
                const diaInicioMs = fechaBase.getTime();
                const diaFinMs = diaInicioMs + 24 * 60 * 60 * 1000;
                // Filtrar citas e inactividades solo de este día
                const citasDelDia = todasLasCitas.filter(c => {
                    const t = new Date(c.fechaInicio).getTime();
                    return t >= diaInicioMs && t < diaFinMs;
                });
                const inactividadesDelDia = todasLasInactividades.filter(p => {
                    const ini = new Date(p.fechaInicio).getTime();
                    const fin = new Date(p.fechaFin).getTime();
                    return ini < diaFinMs && fin > diaInicioMs;
                });
                let totalLibres = 0;
                for (const servicio of servicios) {
                    const duracion = servicio.duracionMinutos ?? 30;
                    for (const sh of servicio.horarios) {
                        const horario = sh.horario;
                        const dias_horario = horario.horarios_dias.map((d) => d.dia_semana);
                        if (!dias_horario.includes(diaNum))
                            continue;
                        const horaInicioRef = new Date(horario.horaInicio);
                        const horaFinRef = new Date(horario.horaFin);
                        let cursor = this._aplicarHoraEnFecha(fechaBase, horaInicioRef);
                        const limite = this._aplicarHoraEnFecha(fechaBase, horaFinRef);
                        while (cursor.getTime() + duracion * 60 * 1000 <= limite.getTime()) {
                            const slotIni = cursor.getTime();
                            const slotFin = slotIni + duracion * 60 * 1000;
                            // Verificar conflicto con citas (del día ya filtrado)
                            const conflictoCita = citasDelDia.some(c => {
                                const cIni = new Date(c.fechaInicio).getTime();
                                const cFin = c.fechaFin
                                    ? new Date(c.fechaFin).getTime()
                                    : cIni + duracion * 60 * 1000;
                                return cIni < slotFin && cFin > slotIni;
                            });
                            // Verificar conflicto con inactividades (del día ya filtrado)
                            const conflictoInac = inactividadesDelDia.some(p => {
                                const pIni = new Date(p.fechaInicio).getTime();
                                const pFin = new Date(p.fechaFin).getTime();
                                return pIni < slotFin && pFin > slotIni;
                            });
                            if (!conflictoCita && !conflictoInac) {
                                totalLibres++;
                            }
                            cursor = new Date(slotFin);
                        }
                    }
                }
                resultado.push({
                    fecha: fechaStr,
                    diaSemana: DIAS_SEMANA[diaNum],
                    mes: MESES[fechaBase.getUTCMonth()],
                    hayDisponibilidad: totalLibres > 0,
                    totalSlotsLibres: totalLibres,
                });
            }
            return resultado;
        }
        finally {
            await prisma.$disconnect();
        }
    }
    // ===================================================================
    // DOCTOR: Listar sus periodos de inactividad
    // ===================================================================
    async listarInactividades(doctorId) {
        return await this.inactividadRepo.listarPorDoctor(doctorId);
    }
    // ===================================================================
    // DOCTOR: Estadísticas de sus pacientes
    // ===================================================================
    async estadisticasPacientesDoctor(doctorId, filtros) {
        return await this.citaRepo.estadisticasPacientes(doctorId, {
            fechaDesde: filtros.fechaDesde ? new Date(filtros.fechaDesde) : undefined,
            fechaHasta: filtros.fechaHasta ? new Date(filtros.fechaHasta) : undefined,
            servicioId: filtros.servicioId,
        });
    }
    // ===================================================================
    // DOCTOR: Estadísticas de sus citas
    // ===================================================================
    async estadisticasCitasDoctor(doctorId, filtros) {
        return await this.citaRepo.estadisticasCitas(doctorId, {
            fechaDesde: filtros.fechaDesde ? new Date(filtros.fechaDesde) : undefined,
            fechaHasta: filtros.fechaHasta ? new Date(filtros.fechaHasta) : undefined,
            servicioId: filtros.servicioId,
        });
    }
    // ===================================================================
    // CALENDARIO: Vista de citas agrupadas por fecha
    // Accessible por Paciente y Doctor
    // ===================================================================
    async calendarioCitas(usuarioId, rol, filtros) {
        // ── 1. Calcular fecha de referencia ──────────────────────────────
        const ref = filtros.fecha ? new Date(`${filtros.fecha}T00:00:00.000Z`) : (() => {
            const hoy = new Date();
            return new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
        })();
        const refStr = ref.toISOString().substring(0, 10);
        const vista = filtros.vista ?? 'hoy';
        // ── 2. Calcular rango [desde, hasta] según vista ─────────────────
        let desde;
        let hasta;
        if (vista === 'hoy' || vista === 'dia') {
            desde = new Date(ref);
            hasta = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate(), 23, 59, 59, 999));
        }
        else if (vista === 'semana') {
            // Lunes de la semana de referencia
            const dow = ref.getUTCDay() === 0 ? 6 : ref.getUTCDay() - 1; // 0=Lunes
            desde = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() - dow));
            hasta = new Date(Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth(), desde.getUTCDate() + 6, 23, 59, 59, 999));
        }
        else { // mes
            desde = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1));
            hasta = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 0, 23, 59, 59, 999));
        }
        const desdeStr = desde.toISOString().substring(0, 10);
        const hastaStr = hasta.toISOString().substring(0, 10);
        // ── 3. Obtener todas las citas del rango (sin paginación) ────────
        const BIG = 9999;
        const { datos } = rol === 'Paciente'
            ? await this.citaRepo.listarPorPaciente(usuarioId, { pagina: 1, limite: BIG, fechaDesde: desde, fechaHasta: hasta })
            : await this.citaRepo.listarPorDoctor(usuarioId, { pagina: 1, limite: BIG, fechaDesde: desde, fechaHasta: hasta });
        // ── 4. Agrupar por fecha local (YYYY-MM-DD de fechaInicio) ───────
        const grouped = new Map();
        for (const cita of datos) {
            // fechaInicio puede venir como string ISO o Date
            const fechaKey = String(cita.fecha ?? cita.fechaInicio ?? '').substring(0, 10);
            if (!grouped.has(fechaKey))
                grouped.set(fechaKey, []);
            grouped.get(fechaKey).push(cita);
        }
        // ── 5. Ordenar días cronológicamente ────────────────────────────
        const dias = [...grouped.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([fecha, citas]) => ({ fecha, total: citas.length, citas }));
        return {
            vista,
            fechaReferencia: refStr,
            rango: { desde: desdeStr, hasta: hastaStr },
            total: datos.length,
            dias,
        };
    }
    // ─── DOCTORES DEL PACIENTE ─────────────────────────────────────────────────
    async misDoctores(pacienteId) {
        return await this.citaRepo.misDoctores(pacienteId);
    }
    // ─── PACIENTES DEL DOCTOR ──────────────────────────────────────────────────
    async listarPacientesDelDoctor(doctorId, filtros) {
        // Convertir fechas string a Date si se proporcionan
        const filtrosRepositorio = {
            ...filtros,
            ultimaCitaDesde: filtros.ultimaCitaDesde ? new Date(filtros.ultimaCitaDesde) : undefined,
            ultimaCitaHasta: filtros.ultimaCitaHasta ? new Date(filtros.ultimaCitaHasta) : undefined,
        };
        return await this.citaRepo.listarPacientesDelDoctor(doctorId, filtrosRepositorio);
    }
    // ===================================================================
    // Futuras citas entre doctor y paciente para vistas combinadas
    // ===================================================================
    async listarFuturasCitas(doctorId, pacienteId) {
        // En MediConnect, las fechas se guardan como "Naive UTC" basadas en AST (America/Santo_Domingo)
        // Construimos la fecha naive "ahora" para filtrar correctamente
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Santo_Domingo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
        const partes = formatter.formatToParts(new Date());
        const d = Object.fromEntries(partes.map((p) => [p.type, p.value]));
        const ahoraAST = new Date(`${d.year}-${d.month}-${d.day}T${d.hour}:${d.minute}:${d.second}.000Z`);
        return await this.citaRepo.listarFuturasCitas(doctorId, pacienteId, ahoraAST);
    }
};
exports.GestionarCitasUseCase = GestionarCitasUseCase;
exports.GestionarCitasUseCase = GestionarCitasUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('CitaRepository')),
    __param(1, (0, tsyringe_1.inject)('DoctorRepository')),
    __param(2, (0, tsyringe_1.inject)('PacienteRepository')),
    __param(3, (0, tsyringe_1.inject)('InactividadRepository')),
    __param(4, (0, tsyringe_1.inject)(EnviarNotificacionUseCase_1.EnviarNotificacionUseCase)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, EnviarNotificacionUseCase_1.EnviarNotificacionUseCase])
], GestionarCitasUseCase);
