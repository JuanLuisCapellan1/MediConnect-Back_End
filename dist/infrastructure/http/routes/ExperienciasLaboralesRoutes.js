"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const ExperienciaLaboralController_1 = require("../controllers/ExperienciaLaboralController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const router = (0, express_1.Router)();
const experienciaLaboralController = tsyringe_1.container.resolve(ExperienciaLaboralController_1.ExperienciaLaboralController);
/**
 * POST /experiencias-laborales
 * Crear una nueva experiencia laboral (requiere autenticación como Doctor)
 */
router.post('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => experienciaLaboralController.crear(req, res));
/**
 * GET /experiencias-laborales
 * Obtener todas las experiencias laborales del doctor autenticado
 */
router.get('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => experienciaLaboralController.obtenerTodos(req, res));
/**
 * GET /experiencias-laborales/:id
 * Obtener una experiencia laboral por ID (con validación de propiedad)
 */
router.get('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => experienciaLaboralController.obtenerPorId(req, res));
/**
 * PUT /experiencias-laborales/:id
 * Actualizar una experiencia laboral (con validación de propiedad)
 */
router.put('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => experienciaLaboralController.actualizar(req, res));
/**
 * DELETE /experiencias-laborales/:id
 * Eliminar (soft delete) una experiencia laboral (con validación de propiedad)
 */
router.delete('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => experienciaLaboralController.eliminar(req, res));
exports.default = router;
