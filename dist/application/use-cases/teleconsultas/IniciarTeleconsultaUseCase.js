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
exports.IniciarTeleconsultaUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const client_1 = require("@prisma/client");
const EnviarNotificacionUseCase_1 = require("../notificaciones/EnviarNotificacionUseCase");
let IniciarTeleconsultaUseCase = class IniciarTeleconsultaUseCase {
    constructor(citaRepo, conversacionesRepo, videoService, prisma, enviarNotifUC) {
        this.citaRepo = citaRepo;
        this.conversacionesRepo = conversacionesRepo;
        this.videoService = videoService;
        this.prisma = prisma;
        this.enviarNotifUC = enviarNotifUC;
        /** Minutos antes del inicio programado en que se puede abrir la sala. */
        this.VENTANA_ANTES_MINUTOS = 15;
    }
    async ejecutar(citaId, doctorId) {
        // ─── 1. Buscar la cita ────────────────────────────────────────────────
        const cita = await this.citaRepo.buscarPorId(citaId);
        if (!cita) {
            throw new Error(`Cita con ID ${citaId} no encontrada.`);
        }
        // ─── 2. Verificar que el doctor autenticado sea el dueño de la cita ──
        if (cita.doctorUsuarioId !== doctorId) {
            throw new Error('No tienes permisos para iniciar esta teleconsulta.');
        }
        // ─── 3. Verificar que la cita esté en estado 'Programada' ────────────
        if (cita.estado !== 'Programada') {
            throw new Error(`Solo se puede iniciar una teleconsulta en estado 'Programada'. ` +
                `Estado actual: '${cita.estado}'.`);
        }
        // ─── 4. Validar ventana horaria ────────────────────────────────────────
        // Solo se bloquea si el doctor intenta abrir demasiado temprano.
        // Si la cita sigue en 'Programada' siempre se puede iniciar (el sistema
        // nunca la auto-completa), sin importar cuánto tiempo haya pasado.
        const ahora = new Date();
        const fechaInicio = new Date(cita.fechaInicio);
        const aperturaMs = fechaInicio.getTime() - this.VENTANA_ANTES_MINUTOS * 60000;
        if (ahora.getTime() < aperturaMs) {
            const minutosRestantes = Math.ceil((aperturaMs - ahora.getTime()) / 60000);
            throw new Error(`Aún no puedes iniciar la teleconsulta. ` +
                `Podrás hacerlo a partir de ${minutosRestantes} minuto(s) antes de la hora programada.`);
        }
        // ─── 5. Buscar o crear Conversacion entre doctor y paciente ───────────
        const pacienteId = cita.pacienteId;
        let conversacion = await this.conversacionesRepo.obtenerPorUsuarios(doctorId, pacienteId);
        if (!conversacion) {
            conversacion = await this.conversacionesRepo.obtenerPorUsuarios(pacienteId, doctorId);
        }
        if (!conversacion) {
            conversacion = await this.conversacionesRepo.crear({
                emisorId: doctorId,
                receptorId: pacienteId,
                estado: 'Activa',
            });
        }
        const conversacionId = conversacion.id;
        // ─── 6. Crear la sala en Daily.co ─────────────────────────────────────
        const duracionMinutos = cita.servicio?.duracionMinutos ?? 30;
        const { urlAcceso, urlPaciente, nombreSala } = await this.videoService.crearSalaPrivada(citaId, duracionMinutos);
        // ─── 7. Registrar LogTeleconsulta ─────────────────────────────────────
        const log = await this.prisma.logTeleconsulta.create({
            data: {
                citaId,
                conversacionId,
                inicio: ahora,
                salaReunion: nombreSala,
                urlPaciente,
                estado: 'Iniciada',
            },
        });
        // ─── 8. Actualizar estado de la Cita a 'En curso' ────────────────────
        await this.citaRepo.actualizar(citaId, { estado: 'En curso' });
        // ─── 9. Notificar al paciente en tiempo real ──────────────────────────
        // En el modelo Prisma, Paciente.usuarioId = @id, así que cita.pacienteId
        // es directamente el usuarioId del paciente — no necesitamos otra query.
        try {
            await this.enviarNotifUC.execute({
                usuarioId: pacienteId,
                titulo: '¡Llamada Entrante!',
                mensaje: `El doctor ha iniciado la videollamada. Úté al enlace para unirte: ${urlPaciente}`,
                tipoAlerta: 'Urgente',
                tipoEntidad: 'Teleconsulta',
                entidadId: citaId,
            });
        }
        catch (notifErr) {
            console.error('IniciarTeleconsultaUseCase: error al notificar al paciente:', notifErr);
        }
        // ─── 10. Retornar resultado ───────────────────────────────────────────
        return {
            urlAcceso,
            logId: log.id,
        };
    }
};
exports.IniciarTeleconsultaUseCase = IniciarTeleconsultaUseCase;
exports.IniciarTeleconsultaUseCase = IniciarTeleconsultaUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('CitaRepository')),
    __param(1, (0, tsyringe_1.inject)('ConversacionesRepository')),
    __param(2, (0, tsyringe_1.inject)('VideoService')),
    __param(3, (0, tsyringe_1.inject)('PrismaClient')),
    __param(4, (0, tsyringe_1.inject)(EnviarNotificacionUseCase_1.EnviarNotificacionUseCase)),
    __metadata("design:paramtypes", [Object, Object, Object, client_1.PrismaClient,
        EnviarNotificacionUseCase_1.EnviarNotificacionUseCase])
], IniciarTeleconsultaUseCase);
