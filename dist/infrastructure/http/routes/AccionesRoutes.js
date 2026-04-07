"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AccionesController_1 = require("../controllers/AccionesController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const router = (0, express_1.Router)();
const accionesController = new AccionesController_1.AccionesController();
/**
 * GET /acciones/pendientes
 * Listar todas las acciones pendientes de revisión de documentos (solo Admin)
 */
router.get('/pendientes', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Admin'), (req, res) => accionesController.listarAccionesPendientes(req, res));
/**
 * GET /acciones/:id
 * Obtener detalle de una acción específica (solo Admin)
 */
router.get('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Admin'), (req, res) => accionesController.obtenerDetalleAccion(req, res));
/**
 * PATCH /acciones/:id/revisar
 * Aprobar o rechazar un documento específico (solo Admin)
 * Body: { decision: 'Aprobada' | 'Rechazada', comentario?: string }
 */
router.patch('/:id/revisar', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Admin'), (req, res) => accionesController.aprobarRechazarDocumento(req, res));
exports.default = router;
