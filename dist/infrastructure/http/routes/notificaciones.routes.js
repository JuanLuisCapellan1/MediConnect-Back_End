"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const NotificacionesController_1 = require("../controllers/NotificacionesController");
const router = (0, express_1.Router)();
const controller = new NotificacionesController_1.NotificacionesController();
// Todas las rutas requieren autenticación
// En desarrollo puedes comentar el middleware para pruebas
/**
 * GET /api/notificaciones
 * Obtiene las notificaciones del usuario autenticado
 * Query params: leidas (boolean), tipoAlerta, tipoEntidad, limite, offset
 */
router.get('/', 
// autenticarJWT, // Descomentar en producción
(req, res) => controller.obtenerNotificaciones(req, res));
/**
 * GET /api/notificaciones/no-leidas/contar
 * Cuenta las notificaciones no leídas del usuario
 */
router.get('/no-leidas/contar', 
// autenticarJWT, // Descomentar en producción
(req, res) => controller.contarNoLeidas(req, res));
/**
 * GET /api/notificaciones/:id
 * Obtiene una notificación específica por ID
 */
router.get('/:id', 
// autenticarJWT, // Descomentar en producción
(req, res) => controller.obtenerNotificacionPorId(req, res));
/**
 * POST /api/notificaciones
 * Crea una nueva notificación
 * Body: { usuarioId, titulo, mensaje, tipoAlerta?, tipoEntidad?, entidadId? }
 */
router.post('/', 
// autenticarJWT, // Descomentar en producción
(req, res) => controller.crearNotificacion(req, res));
/**
 * PATCH /api/notificaciones/:id/leer
 * Marca una notificación como leída
 */
router.patch('/:id/leer', 
// autenticarJWT, // Descomentar en producción
(req, res) => controller.marcarComoLeida(req, res));
/**
 * PATCH /api/notificaciones/leer-varias
 * Marca varias notificaciones como leídas
 * Body: { notificacionesIds: number[] }
 */
router.patch('/leer-varias', 
// autenticarJWT, // Descomentar en producción
(req, res) => controller.marcarVariasComoLeidas(req, res));
/**
 * PATCH /api/notificaciones/leer-todas
 * Marca todas las notificaciones del usuario como leídas
 */
router.patch('/leer-todas', 
// autenticarJWT, // Descomentar en producción
(req, res) => controller.marcarTodasComoLeidas(req, res));
/**
 * DELETE /api/notificaciones/:id
 * Elimina (desactiva) una notificación
 */
router.delete('/:id', 
// autenticarJWT, // Descomentar en producción
(req, res) => controller.eliminarNotificacion(req, res));
/**
 * DELETE /api/notificaciones/eliminar-varias
 * Elimina (desactiva) varias notificaciones
 * Body: { notificacionesIds: number[] }
 */
router.delete('/eliminar-varias', 
// autenticarJWT, // Descomentar en producción
(req, res) => controller.eliminarVarias(req, res));
exports.default = router;
