"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DoctorController_1 = require("../controllers/DoctorController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const router = (0, express_1.Router)();
const doctorController = new DoctorController_1.DoctorController();
/**
 * GET /doctores
 * Listar doctores (solo Admin)
 */
router.get('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Admin'), (req, res) => doctorController.listar(req, res));
/**
 * GET /doctores/me
 * Obtener perfil del doctor autenticado
 */
router.get('/me', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => doctorController.obtenerPerfil(req, res));
/**
 * GET /doctores/:id
 * Obtener doctor por ID (solo Admin)
 */
router.get('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Admin'), (req, res) => doctorController.obtenerPorId(req, res));
/**
 * PATCH /doctores/me
 * Actualizar perfil del doctor autenticado
 */
router.patch('/me', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => doctorController.actualizarPerfil(req, res));
/**
 * PATCH /doctores/:id
 * Actualizar doctor por ID (solo Admin)
 */
router.patch('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Admin'), (req, res) => doctorController.actualizar(req, res));
/**
 * DELETE /doctores/:id
 * Eliminar doctor (solo Admin)
 */
router.delete('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Admin'), (req, res) => doctorController.eliminar(req, res));
exports.default = router;
