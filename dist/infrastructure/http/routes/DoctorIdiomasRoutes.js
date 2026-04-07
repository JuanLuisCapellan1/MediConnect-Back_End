"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DoctorIdiomaController_1 = require("../controllers/DoctorIdiomaController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const TranslationMiddleware_1 = require("../middlewares/TranslationMiddleware");
const router = (0, express_1.Router)();
const doctorIdiomaController = new DoctorIdiomaController_1.DoctorIdiomaController();
/**
 * POST /doctores/idiomas
 * Agregar un idioma al doctor autenticado
 */
router.post('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => doctorIdiomaController.agregar(req, res));
/**
 * GET /doctores/idiomas
 * Obtener todos los idiomas del doctor autenticado
 */
router.get('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), TranslationMiddleware_1.translationMiddleware, (req, res) => doctorIdiomaController.obtenerIdiomas(req, res));
/**
 * PATCH /doctores/idiomas/:id
 * Actualizar un idioma del doctor autenticado
 */
router.patch('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => doctorIdiomaController.actualizar(req, res));
/**
 * DELETE /doctores/idiomas/:id
 * Eliminar un idioma del doctor autenticado
 */
router.delete('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => doctorIdiomaController.eliminar(req, res));
exports.default = router;
