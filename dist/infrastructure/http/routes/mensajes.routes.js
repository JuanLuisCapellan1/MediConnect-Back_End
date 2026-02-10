"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const MensajesController_1 = require("../controllers/MensajesController");
const autenticacion_1 = require("../middlewares/autenticacion");
const router = (0, express_1.Router)();
const controller = new MensajesController_1.MensajesController();
// Todas las rutas de mensajes requieren autenticación
router.use(autenticacion_1.autenticarJWT);
/**
 * @route   GET /api/conversaciones/:conversacionId/mensajes
 * @desc    Obtiene los mensajes de una conversación
 * @access  Private
 */
router.get('/:conversacionId/mensajes', (req, res) => controller.obtenerMensajes(req, res));
/**
 * @route   POST /api/conversaciones/:conversacionId/mensajes
 * @desc    Crea un nuevo mensaje en una conversación
 * @access  Private
 */
router.post('/:conversacionId/mensajes', (req, res) => controller.crearMensaje(req, res));
/**
 * @route   POST /api/conversaciones/:conversacionId/marcar-leidos
 * @desc    Marca mensajes como leídos
 * @access  Private
 */
router.post('/:conversacionId/marcar-leidos', (req, res) => controller.marcarMensajesLeidos(req, res));
/**
 * @route   GET /api/conversaciones/:conversacionId/no-leidos
 * @desc    Cuenta mensajes no leídos en una conversación
 * @access  Private
 */
router.get('/:conversacionId/no-leidos', (req, res) => controller.contarNoLeidos(req, res));
/**
 * @route   GET /api/conversaciones/:conversacionId/buscar
 * @desc    Busca mensajes en una conversación
 * @access  Private
 */
router.get('/:conversacionId/buscar', (req, res) => controller.buscarMensajes(req, res));
/**
 * @route   PATCH /api/mensajes/:id
 * @desc    Actualiza (edita) un mensaje
 * @access  Private
 */
router.put('/mensajes/:id', (req, res) => controller.actualizarMensaje(req, res));
/**
 * @route   DELETE /api/mensajes/:id
 * @desc    Elimina un mensaje
 * @access  Private
 */
router.delete('/mensajes/:id', (req, res) => controller.eliminarMensaje(req, res));
exports.default = router;
