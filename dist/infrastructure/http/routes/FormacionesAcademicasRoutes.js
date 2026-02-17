"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const FormacionAcademicaController_1 = require("../controllers/FormacionAcademicaController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const TranslationMiddleware_1 = require("../middlewares/TranslationMiddleware");
const router = (0, express_1.Router)();
const formacionAcademicaController = tsyringe_1.container.resolve(FormacionAcademicaController_1.FormacionAcademicaController);
// Crear una nueva formación académica (requiere autenticación como Doctor)
router.post('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), formacionAcademicaController.crear);
// Obtener todas las formaciones académicas del doctor autenticado (con traducción)
router.get('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), TranslationMiddleware_1.translationMiddleware, formacionAcademicaController.obtenerTodos);
// Obtener una formación académica por ID (solo si pertenece al doctor autenticado)
router.get('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), formacionAcademicaController.obtenerPorId);
// Actualizar una formación académica (solo si pertenece al doctor autenticado)
router.put('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), formacionAcademicaController.actualizar);
// Eliminar una formación académica (soft delete, solo si pertenece al doctor autenticado)
router.delete('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), formacionAcademicaController.eliminar);
exports.default = router;
