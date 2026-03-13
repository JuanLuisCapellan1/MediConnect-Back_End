"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mensajesRouter = exports.conversacionesRouter = void 0;
const express_1 = require("express");
const MensajesController_1 = require("../controllers/MensajesController");
const autenticacion_1 = require("../middlewares/autenticacion");
const controller = new MensajesController_1.MensajesController();
// ─── Router montado en /conversaciones ───────────────────────────────────────
const conversacionesRouter = (0, express_1.Router)();
exports.conversacionesRouter = conversacionesRouter;
conversacionesRouter.use(autenticacion_1.autenticarJWT);
/**
 * GET /api/conversaciones/:conversacionId/mensajes
 * Obtiene los mensajes de una conversación
 */
conversacionesRouter.get('/:conversacionId/mensajes', (req, res) => controller.obtenerMensajes(req, res));
/**
 * POST /api/conversaciones/:conversacionId/mensajes
 * Crea un nuevo mensaje en una conversación
 */
conversacionesRouter.post('/:conversacionId/mensajes', (req, res) => controller.crearMensaje(req, res));
/**
 * POST /api/conversaciones/:conversacionId/marcar-leidos
 * Marca mensajes como leídos
 */
conversacionesRouter.post('/:conversacionId/marcar-leidos', (req, res) => controller.marcarMensajesLeidos(req, res));
/**
 * GET /api/conversaciones/:conversacionId/no-leidos
 * Cuenta mensajes no leídos en una conversación
 */
conversacionesRouter.get('/:conversacionId/no-leidos', (req, res) => controller.contarNoLeidos(req, res));
/**
 * GET /api/conversaciones/:conversacionId/buscar
 * Busca mensajes en una conversación
 */
conversacionesRouter.get('/:conversacionId/buscar', (req, res) => controller.buscarMensajes(req, res));
// ─── Router montado en /mensajes (operaciones sobre mensajes individuales) ───
const mensajesRouter = (0, express_1.Router)();
exports.mensajesRouter = mensajesRouter;
mensajesRouter.use(autenticacion_1.autenticarJWT);
/**
 * PATCH /api/mensajes/:id
 * Edita el contenido de un mensaje (solo el remitente)
 */
mensajesRouter.patch('/:id', (req, res) => controller.actualizarMensaje(req, res));
/**
 * DELETE /api/mensajes/:id
 * Elimina un mensaje (soft delete, solo el remitente)
 */
mensajesRouter.delete('/:id', (req, res) => controller.eliminarMensaje(req, res));
exports.default = conversacionesRouter;
