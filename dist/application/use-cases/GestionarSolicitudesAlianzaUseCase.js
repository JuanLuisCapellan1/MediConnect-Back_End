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
exports.GestionarSolicitudesAlianzaUseCase = void 0;
const tsyringe_1 = require("tsyringe");
let GestionarSolicitudesAlianzaUseCase = class GestionarSolicitudesAlianzaUseCase {
    constructor(solicitudRepo, centroRepo) {
        this.solicitudRepo = solicitudRepo;
        this.centroRepo = centroRepo;
    }
    /**
     * Enviar solicitud de alianza.
     * rol = 'CentroSalud' → el centro le envía una solicitud a un doctor
     * rol = 'Doctor'      → el doctor le envía una solicitud a un centro
     */
    async enviarSolicitud(remitenteId, rol, dto) {
        const doctorId = rol === 'Doctor' ? remitenteId : dto.destinatarioId;
        const centroSaludId = rol === 'CentroSalud' ? remitenteId : dto.destinatarioId;
        const iniciadaPor = rol === 'Doctor' ? 'Doctor' : 'Centro';
        // Validar que no exista una relación activa (Pendiente o Aceptada)
        const existente = await this.solicitudRepo.buscarExistente(doctorId, centroSaludId);
        if (existente) {
            if (existente.estado === 'Aceptada') {
                throw new Error('Ya existe una alianza activa entre este doctor y este centro');
            }
            if (existente.estado === 'Pendiente') {
                throw new Error('Ya existe una solicitud de alianza pendiente entre este doctor y este centro');
            }
        }
        return await this.solicitudRepo.crear({
            doctorId,
            centroSaludId,
            mensaje: dto.mensaje,
            iniciadaPor,
        });
    }
    /**
     * Listar solicitudes según el rol del usuario autenticado.
     */
    async listarSolicitudes(usuarioId, rol) {
        if (rol === 'CentroSalud') {
            return await this.solicitudRepo.listarPorCentro(usuarioId);
        }
        return await this.solicitudRepo.listarPorDoctor(usuarioId);
    }
    /**
     * Responder a una solicitud recibida.
     * Solo el DESTINATARIO puede responder (aceptar/rechazar).
     */
    async responderSolicitud(solicitudId, usuarioId, rol, dto) {
        const solicitud = await this.solicitudRepo.buscarPorId(solicitudId);
        if (!solicitud)
            throw new Error('Solicitud de alianza no encontrada');
        if (solicitud.estado !== 'Pendiente') {
            throw new Error('Solo se pueden responder solicitudes en estado Pendiente');
        }
        // Validar que quien responde es el destinatario (no quien inició)
        if (rol === 'CentroSalud') {
            if (solicitud.centroSaludId !== usuarioId) {
                throw new Error('No tienes permisos para responder esta solicitud');
            }
            // Centro puede responder solo solicitudes que inició el Doctor
            if (solicitud.iniciadaPor !== 'Doctor') {
                throw new Error('No puedes responder tus propias solicitudes');
            }
        }
        else {
            // Doctor
            if (solicitud.doctorId !== usuarioId) {
                throw new Error('No tienes permisos para responder esta solicitud');
            }
            // Doctor puede responder solo solicitudes que inició el Centro
            if (solicitud.iniciadaPor !== 'Centro') {
                throw new Error('No puedes responder tus propias solicitudes');
            }
        }
        if (dto.estado === 'Rechazada' && !dto.motivoRechazo?.trim()) {
            throw new Error('El motivo de rechazo es requerido al rechazar una solicitud');
        }
        return await this.solicitudRepo.actualizar(solicitudId, {
            estado: dto.estado,
            motivoRechazo: dto.estado === 'Rechazada' ? dto.motivoRechazo : null,
        });
    }
};
exports.GestionarSolicitudesAlianzaUseCase = GestionarSolicitudesAlianzaUseCase;
exports.GestionarSolicitudesAlianzaUseCase = GestionarSolicitudesAlianzaUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('SolicitudAlianzaRepository')),
    __param(1, (0, tsyringe_1.inject)('CentroSaludRepository')),
    __metadata("design:paramtypes", [Object, Object])
], GestionarSolicitudesAlianzaUseCase);
