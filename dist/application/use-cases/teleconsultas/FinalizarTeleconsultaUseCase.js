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
exports.FinalizarTeleconsultaUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const client_1 = require("@prisma/client");
const EnviarNotificacionUseCase_1 = require("../notificaciones/EnviarNotificacionUseCase");
let FinalizarTeleconsultaUseCase = class FinalizarTeleconsultaUseCase {
    constructor(citaRepo, videoService, prisma, enviarNotifUC) {
        this.citaRepo = citaRepo;
        this.videoService = videoService;
        this.prisma = prisma;
        this.enviarNotifUC = enviarNotifUC;
    }
    async ejecutar(citaId, usuarioId) {
        // ─── 1. Verificar que la cita existe ──────────────────────────────────
        const cita = await this.citaRepo.buscarPorId(citaId);
        if (!cita) {
            throw new Error(`Cita con ID ${citaId} no encontrada.`);
        }
        // ─── 2. Validar que el usuario es el doctor o el paciente de la cita ──
        const esDoctorDeCita = cita.doctorUsuarioId === usuarioId;
        const esPacienteDeCita = cita.pacienteId === usuarioId;
        if (!esDoctorDeCita && !esPacienteDeCita) {
            throw new Error('No tienes permisos para finalizar esta teleconsulta.');
        }
        // ─── 3. Buscar el LogTeleconsulta activo (estado 'Iniciada') ──────────
        const log = await this.prisma.logTeleconsulta.findFirst({
            where: { citaId, estado: 'Iniciada' },
            orderBy: { inicio: 'desc' },
        });
        if (!log) {
            throw new Error(`No existe una teleconsulta activa para la cita ${citaId}. ` +
                `Solo se puede finalizar una teleconsulta en estado 'Iniciada'.`);
        }
        // ─── 4. Calcular duración ─────────────────────────────────────────────
        const fechaFin = new Date();
        const duracionMs = fechaFin.getTime() - log.inicio.getTime();
        const duracionMinutos = Math.max(1, Math.ceil(duracionMs / 60000));
        // ─── 5. Actualizar LogTeleconsulta ───────────────────────────────────
        await this.prisma.logTeleconsulta.update({
            where: { id: log.id },
            data: { fin: fechaFin, duracionMinutos, estado: 'Finalizada' },
        });
        // ─── 6. Cita queda 'En curso' hasta que el doctor diagnostique ────────
        await this.citaRepo.actualizar(citaId, { estado: 'En curso' });
        // ─── 7. Destruir sala en Daily.co (fire-and-forget) ───────────────────
        if (log.salaReunion) {
            await this.videoService.eliminarSala(log.salaReunion);
        }
        // ─── 8. Notificar al otro participante ────────────────────────────────
        // Si el doctor cuelga → notificar al paciente (y viceversa)
        try {
            const destinatarioId = esDoctorDeCita ? cita.pacienteId : cita.doctorUsuarioId;
            await this.enviarNotifUC.execute({
                usuarioId: destinatarioId,
                titulo: 'Teleconsulta Finalizada',
                mensaje: `La videollamada ha terminado. Duración: ${duracionMinutos} minuto(s).`,
                tipoAlerta: 'Informacion',
                tipoEntidad: 'Teleconsulta',
                entidadId: citaId,
            });
        }
        catch (notifErr) {
            console.error('FinalizarTeleconsultaUseCase: error al notificar:', notifErr);
        }
        // ─── 9. Retornar resultado ────────────────────────────────────────────
        return {
            mensaje: `Teleconsulta finalizada. Duración: ${duracionMinutos} minuto(s).`,
            duracionMinutos,
        };
    }
};
exports.FinalizarTeleconsultaUseCase = FinalizarTeleconsultaUseCase;
exports.FinalizarTeleconsultaUseCase = FinalizarTeleconsultaUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('CitaRepository')),
    __param(1, (0, tsyringe_1.inject)('VideoService')),
    __param(2, (0, tsyringe_1.inject)('PrismaClient')),
    __param(3, (0, tsyringe_1.inject)(EnviarNotificacionUseCase_1.EnviarNotificacionUseCase)),
    __metadata("design:paramtypes", [Object, Object, client_1.PrismaClient,
        EnviarNotificacionUseCase_1.EnviarNotificacionUseCase])
], FinalizarTeleconsultaUseCase);
