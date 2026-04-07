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
exports.GestionarNotificacionesUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const Notificacion_1 = require("../../domain/entities/Notificacion");
let GestionarNotificacionesUseCase = class GestionarNotificacionesUseCase {
    constructor(notificacionesRepository) {
        this.notificacionesRepository = notificacionesRepository;
    }
    /**
     * Crea una nueva notificación
     */
    async crear(dto) {
        // Validaciones básicas
        if (!dto.titulo || dto.titulo.trim().length === 0) {
            throw new Error('El título es obligatorio');
        }
        if (!dto.mensaje || dto.mensaje.trim().length === 0) {
            throw new Error('El mensaje es obligatorio');
        }
        if (dto.titulo.length > 100) {
            throw new Error('El título no puede exceder 100 caracteres');
        }
        const notificacion = new Notificacion_1.Notificacion(0, // El ID será asignado por la base de datos
        dto.usuarioId, dto.titulo, dto.mensaje, dto.tipoAlerta || 'Informacion', dto.tipoEntidad, dto.entidadId);
        return await this.notificacionesRepository.crear(notificacion);
    }
    /**
     * Obtiene las notificaciones de un usuario con filtros
     */
    async obtenerPorUsuario(filtros) {
        const [notificaciones, noLeidas] = await Promise.all([
            this.notificacionesRepository.obtenerPorUsuario(filtros),
            this.notificacionesRepository.contarNoLeidas(filtros.usuarioId)
        ]);
        return {
            notificaciones,
            total: notificaciones.length,
            noLeidas
        };
    }
    /**
     * Obtiene una notificación por ID
     */
    async obtenerPorId(id, usuarioId) {
        const notificacion = await this.notificacionesRepository.obtenerPorId(id);
        if (!notificacion) {
            throw new Error('Notificación no encontrada');
        }
        // Verificar que la notificación pertenece al usuario
        if (notificacion.usuarioId !== usuarioId) {
            throw new Error('No tienes permiso para acceder a esta notificación');
        }
        return notificacion;
    }
    /**
     * Marca una notificación como leída
     */
    async marcarComoLeida(dto) {
        const notificacion = await this.notificacionesRepository.marcarComoLeida(dto.notificacionId, dto.usuarioId);
        if (!notificacion) {
            throw new Error('Notificación no encontrada o no tienes permiso');
        }
        return notificacion;
    }
    /**
     * Marca varias notificaciones como leídas
     */
    async marcarVariasComoLeidas(dto) {
        if (!dto.notificacionesIds || dto.notificacionesIds.length === 0) {
            throw new Error('Debe proporcionar al menos una notificación');
        }
        return await this.notificacionesRepository.marcarVariasComoLeidas(dto.notificacionesIds, dto.usuarioId);
    }
    /**
     * Marca todas las notificaciones de un usuario como leídas
     */
    async marcarTodasComoLeidas(usuarioId) {
        return await this.notificacionesRepository.marcarTodasComoLeidas(usuarioId);
    }
    /**
     * Cuenta las notificaciones no leídas de un usuario
     */
    async contarNoLeidas(usuarioId) {
        return await this.notificacionesRepository.contarNoLeidas(usuarioId);
    }
    /**
     * Elimina (desactiva) una notificación
     */
    async eliminar(id, usuarioId) {
        const resultado = await this.notificacionesRepository.eliminar(id, usuarioId);
        if (!resultado) {
            throw new Error('Notificación no encontrada o no tienes permiso');
        }
        return resultado;
    }
    /**
     * Elimina (desactiva) varias notificaciones
     */
    async eliminarVarias(ids, usuarioId) {
        if (!ids || ids.length === 0) {
            throw new Error('Debe proporcionar al menos una notificación');
        }
        return await this.notificacionesRepository.eliminarVarias(ids, usuarioId);
    }
};
exports.GestionarNotificacionesUseCase = GestionarNotificacionesUseCase;
exports.GestionarNotificacionesUseCase = GestionarNotificacionesUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('NotificacionesRepository')),
    __metadata("design:paramtypes", [Object])
], GestionarNotificacionesUseCase);
