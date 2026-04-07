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
exports.MarcarNotificacionLeidaUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const NotificacionesWebSocketService_1 = require("../../../infrastructure/external-services/NotificacionesWebSocketService");
let MarcarNotificacionLeidaUseCase = class MarcarNotificacionLeidaUseCase {
    constructor(repo, wsService) {
        this.repo = repo;
        this.wsService = wsService;
    }
    async execute(notificacionId, usuarioId) {
        // 1. Marcar como leída (valida automáticamente que pertenece al usuario)
        const notificacion = await this.repo.marcarComoLeida(notificacionId, usuarioId);
        if (!notificacion) {
            throw new Error('Notificación no encontrada o no tienes permiso.');
        }
        // 2. Emitir contador actualizado por WebSocket
        try {
            const contador = await this.repo.contarNoLeidas(usuarioId);
            this.wsService.enviarContadorNoLeidas(usuarioId, contador);
        }
        catch (wsErr) {
            console.error('MarcarNotificacionLeidaUseCase: error WS al emitir contador:', wsErr);
        }
        return notificacion;
    }
};
exports.MarcarNotificacionLeidaUseCase = MarcarNotificacionLeidaUseCase;
exports.MarcarNotificacionLeidaUseCase = MarcarNotificacionLeidaUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('NotificacionesRepository')),
    __param(1, (0, tsyringe_1.inject)(NotificacionesWebSocketService_1.NotificacionesWebSocketService)),
    __metadata("design:paramtypes", [Object, NotificacionesWebSocketService_1.NotificacionesWebSocketService])
], MarcarNotificacionLeidaUseCase);
