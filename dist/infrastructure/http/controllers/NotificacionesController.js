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
exports.NotificacionesController = void 0;
const tsyringe_1 = require("tsyringe");
const ObtenerNotificacionesUseCase_1 = require("../../../application/use-cases/notificaciones/ObtenerNotificacionesUseCase");
const MarcarNotificacionLeidaUseCase_1 = require("../../../application/use-cases/notificaciones/MarcarNotificacionLeidaUseCase");
const GestionarNotificacionesUseCase_1 = require("../../../application/use-cases/GestionarNotificacionesUseCase");
let NotificacionesController = class NotificacionesController {
    constructor(obtenerUC, marcarUC, gestionarUC) {
        this.obtenerUC = obtenerUC;
        this.marcarUC = marcarUC;
        this.gestionarUC = gestionarUC;
    }
    // ─── Helpers ──────────────────────────────────────────────────────────────
    uid(req) {
        return req.user?.userId ?? null;
    }
    noAuth(res) {
        res.status(401).json({ success: false, message: 'No autenticado.' });
    }
    serverError(res, error) {
        console.error('NotificacionesController:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
    // ─── GET /notificaciones ─────────────────────────────────────────────────
    // Obtiene las notificaciones del usuario autenticado (creadoEn DESC).
    // Query: ?leidas=false  ?tipoAlerta=Informacion  ?limite=50  ?offset=0
    async obtenerNotificaciones(req, res) {
        const usuarioId = this.uid(req);
        if (!usuarioId) {
            this.noAuth(res);
            return;
        }
        try {
            const offsetParam = parseInt(req.query.offset, 10);
            let leidasParam = undefined;
            if (req.query.leidas === 'true')
                leidasParam = true;
            else if (req.query.leidas === 'false')
                leidasParam = false;
            const resultado = await this.obtenerUC.execute({
                usuarioId,
                limite: Number(req.query.limite) || 50,
                offset: isNaN(offsetParam) ? 0 : offsetParam,
                leidas: leidasParam,
                tipoAlerta: req.query.tipoAlerta,
            });
            res.status(200).json({
                success: true,
                data: {
                    notificaciones: resultado.notificaciones.map(n => n.toJSON()),
                    noLeidas: resultado.noLeidas,
                    total: resultado.total,
                },
            });
        }
        catch (error) {
            this.serverError(res, error);
        }
    }
    // ─── GET /notificaciones/no-leidas/contar ─────────────────────────────────
    async contarNoLeidas(req, res) {
        const usuarioId = this.uid(req);
        if (!usuarioId) {
            this.noAuth(res);
            return;
        }
        try {
            const contador = await this.gestionarUC.contarNoLeidas(usuarioId);
            res.status(200).json({ success: true, data: { contador } });
        }
        catch (error) {
            this.serverError(res, error);
        }
    }
    // ─── PATCH /notificaciones/:id/leer ───────────────────────────────────────
    // Marca una notificación como leída y emite el contador actualizado por WS.
    async marcarComoLeida(req, res) {
        const usuarioId = this.uid(req);
        if (!usuarioId) {
            this.noAuth(res);
            return;
        }
        const notificacionId = Number(req.params.id);
        if (isNaN(notificacionId) || notificacionId <= 0) {
            res.status(400).json({ success: false, message: 'ID de notificación inválido.' });
            return;
        }
        try {
            const notificacion = await this.marcarUC.execute(notificacionId, usuarioId);
            res.status(200).json({
                success: true,
                message: 'Notificación marcada como leída.',
                data: notificacion.toJSON(),
            });
        }
        catch (error) {
            const msg = error?.message ?? '';
            if (msg.includes('no encontrada') || msg.includes('no tienes permiso')) {
                res.status(404).json({ success: false, message: msg });
                return;
            }
            this.serverError(res, error);
        }
    }
    // ─── PATCH /notificaciones/leer-varias ───────────────────────────────────
    async marcarVariasComoLeidas(req, res) {
        const usuarioId = this.uid(req);
        if (!usuarioId) {
            this.noAuth(res);
            return;
        }
        const notificacionesIds = req.body.notificacionesIds;
        if (!Array.isArray(notificacionesIds) || notificacionesIds.length === 0) {
            res.status(400).json({ success: false, message: 'notificacionesIds debe ser un array con al menos un ID.' });
            return;
        }
        try {
            const dto = { notificacionesIds, usuarioId };
            const cantidadMarcadas = await this.gestionarUC.marcarVariasComoLeidas(dto);
            const contador = await this.gestionarUC.contarNoLeidas(usuarioId);
            // emit via WS is done inside GestionarNotificacionesUseCase omitted; done via MarcarNotificacionLeidaUseCase only for single
            res.status(200).json({
                success: true,
                message: `${cantidadMarcadas} notificaciones marcadas como leídas.`,
                data: { cantidadMarcadas, noLeidas: contador },
            });
        }
        catch (error) {
            this.serverError(res, error);
        }
    }
    // ─── PATCH /notificaciones/leer-todas ─────────────────────────────────────
    async marcarTodasComoLeidas(req, res) {
        const usuarioId = this.uid(req);
        if (!usuarioId) {
            this.noAuth(res);
            return;
        }
        try {
            const cantidadMarcadas = await this.gestionarUC.marcarTodasComoLeidas(usuarioId);
            res.status(200).json({
                success: true,
                message: `${cantidadMarcadas} notificaciones marcadas como leídas.`,
                data: { cantidadMarcadas },
            });
        }
        catch (error) {
            this.serverError(res, error);
        }
    }
    // ─── DELETE /notificaciones/:id ───────────────────────────────────────────
    async eliminarNotificacion(req, res) {
        const usuarioId = this.uid(req);
        if (!usuarioId) {
            this.noAuth(res);
            return;
        }
        const id = Number(req.params.id);
        if (isNaN(id) || id <= 0) {
            res.status(400).json({ success: false, message: 'ID de notificación inválido.' });
            return;
        }
        try {
            await this.gestionarUC.eliminar(id, usuarioId);
            res.status(200).json({ success: true, message: 'Notificación eliminada exitosamente.' });
        }
        catch (error) {
            const msg = error?.message ?? '';
            if (msg.includes('no encontrada') || msg.includes('no tienes permiso')) {
                res.status(404).json({ success: false, message: msg });
                return;
            }
            this.serverError(res, error);
        }
    }
};
exports.NotificacionesController = NotificacionesController;
exports.NotificacionesController = NotificacionesController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(ObtenerNotificacionesUseCase_1.ObtenerNotificacionesUseCase)),
    __param(1, (0, tsyringe_1.inject)(MarcarNotificacionLeidaUseCase_1.MarcarNotificacionLeidaUseCase)),
    __param(2, (0, tsyringe_1.inject)(GestionarNotificacionesUseCase_1.GestionarNotificacionesUseCase)),
    __metadata("design:paramtypes", [ObtenerNotificacionesUseCase_1.ObtenerNotificacionesUseCase,
        MarcarNotificacionLeidaUseCase_1.MarcarNotificacionLeidaUseCase,
        GestionarNotificacionesUseCase_1.GestionarNotificacionesUseCase])
], NotificacionesController);
