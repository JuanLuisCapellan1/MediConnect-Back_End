"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const autenticacion_1 = require("../middlewares/autenticacion");
const NotificacionesController_1 = require("../controllers/NotificacionesController");
const router = (0, express_1.Router)();
// Resuelve el controlador desde el container en cada petición (singleton seguro)
const ctrl = () => tsyringe_1.container.resolve(NotificacionesController_1.NotificacionesController);
/**
 * GET /notificaciones
 * Lista las notificaciones del usuario autenticado, ordenadas por creadoEn DESC.
 * Query: ?leidas=false  ?tipoAlerta=Informacion  ?tipoEntidad=Cita  ?limite=50  ?offset=0
 */
router.get('/', autenticacion_1.autenticarJWT, (req, res) => ctrl().obtenerNotificaciones(req, res));
/**
 * GET /notificaciones/no-leidas/contar
 * Retorna el número de notificaciones no leídas (para el badge de la campana).
 */
router.get('/no-leidas/contar', autenticacion_1.autenticarJWT, (req, res) => ctrl().contarNoLeidas(req, res));
/**
 * PATCH /notificaciones/leer-todas
 * Marca todas las notificaciones del usuario como leídas.
 */
router.patch('/leer-todas', autenticacion_1.autenticarJWT, (req, res) => ctrl().marcarTodasComoLeidas(req, res));
/**
 * PATCH /notificaciones/leer-varias
 * Body: { notificacionesIds: number[] }
 */
router.patch('/leer-varias', autenticacion_1.autenticarJWT, (req, res) => ctrl().marcarVariasComoLeidas(req, res));
/**
 * PATCH /notificaciones/:id/leer
 * Marca una notificación específica como leída y emite el contador actualizado por WS.
 */
router.patch('/:id/leer', autenticacion_1.autenticarJWT, (req, res) => ctrl().marcarComoLeida(req, res));
/**
 * DELETE /notificaciones/:id
 * Soft-delete: cambia estado a 'Inactivo'.
 */
router.delete('/:id', autenticacion_1.autenticarJWT, (req, res) => ctrl().eliminarNotificacion(req, res));
exports.default = router;
