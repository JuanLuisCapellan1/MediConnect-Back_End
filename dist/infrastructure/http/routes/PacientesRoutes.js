"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PacienteController_1 = require("../controllers/PacienteController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const TranslationMiddleware_1 = require("../middlewares/TranslationMiddleware");
const router = (0, express_1.Router)();
const pacienteController = new PacienteController_1.PacienteController();
/**
 * GET /pacientes
 * Listar pacientes (solo Admin)
 */
router.get('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Admin'), TranslationMiddleware_1.translationMiddleware, (req, res) => pacienteController.listar(req, res));
/**
 * GET /pacientes/me
 * Obtener perfil del paciente autenticado
 */
router.get('/me', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), TranslationMiddleware_1.translationMiddleware, (req, res) => pacienteController.obtenerPerfil(req, res));
/**
 * GET /pacientes/:id
 * Obtener paciente por ID (solo Admin)
 */
router.get('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Admin'), TranslationMiddleware_1.translationMiddleware, (req, res) => pacienteController.obtenerPorId(req, res));
/**
 * PATCH /pacientes/me
 * Actualizar perfil del paciente autenticado
 */
router.patch('/me', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => pacienteController.actualizarPerfil(req, res));
/**
 * PATCH /pacientes/:id
 * Actualizar paciente por ID (solo Admin)
 */
router.patch('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Admin'), (req, res) => pacienteController.actualizar(req, res));
/**
 * DELETE /pacientes/:id
 * Eliminar paciente (solo Admin)
 */
router.delete('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Admin'), (req, res) => pacienteController.eliminar(req, res));
exports.default = router;
