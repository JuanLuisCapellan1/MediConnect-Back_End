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
exports.EnviarNotificacionUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const Notificacion_1 = require("../../../domain/entities/Notificacion");
const NotificacionesWebSocketService_1 = require("../../../infrastructure/external-services/NotificacionesWebSocketService");
/**
 * Caso de uso maestro: crea la notificación en BD, la emite por WebSocket
 * y actualiza el contador de no leídas del usuario en tiempo real.
 *
 * @example
 *   await enviarNotifUC.execute({ usuarioId, titulo: 'Cita confirmada', mensaje: '...', tipoAlerta: 'Exito', tipoEntidad: 'Cita', entidadId: citaId });
 */
let EnviarNotificacionUseCase = class EnviarNotificacionUseCase {
    constructor(repo, wsService) {
        this.repo = repo;
        this.wsService = wsService;
    }
    async execute(datos) {
        if (!datos.titulo?.trim())
            throw new Error('El título es obligatorio.');
        if (!datos.mensaje?.trim())
            throw new Error('El mensaje es obligatorio.');
        if (datos.titulo.length > 100)
            throw new Error('El título no puede exceder 100 caracteres.');
        const entidad = new Notificacion_1.Notificacion(0, datos.usuarioId, datos.titulo.trim(), datos.mensaje.trim(), datos.tipoAlerta ?? 'Informacion', datos.tipoEntidad, datos.entidadId);
        // 1. Persistir
        const creada = await this.repo.crear(entidad);
        // 2. Emitir notificación y contador actualizado
        try {
            this.wsService.enviarNotificacionAUsuario(datos.usuarioId, creada);
            const contador = await this.repo.contarNoLeidas(datos.usuarioId);
            this.wsService.enviarContadorNoLeidas(datos.usuarioId, contador);
        }
        catch (wsErr) {
            console.error(`EnviarNotificacionUseCase: error WS para usuario ${datos.usuarioId}:`, wsErr);
        }
        return creada;
    }
};
exports.EnviarNotificacionUseCase = EnviarNotificacionUseCase;
exports.EnviarNotificacionUseCase = EnviarNotificacionUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('NotificacionesRepository')),
    __param(1, (0, tsyringe_1.inject)(NotificacionesWebSocketService_1.NotificacionesWebSocketService)),
    __metadata("design:paramtypes", [Object, NotificacionesWebSocketService_1.NotificacionesWebSocketService])
], EnviarNotificacionUseCase);
