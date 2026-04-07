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
// Crear una nueva formación académica (solo Doctor)
router.post('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), formacionAcademicaController.crear);
// Obtener todas las formaciones académicas del doctor autenticado (solo Doctor)
router.get('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), TranslationMiddleware_1.translationMiddleware, formacionAcademicaController.obtenerTodos);
/**
 * GET /formaciones-academicas/doctor/:doctorId
 * Obtener formaciones activas de un doctor específico
 * Acceso: cualquier usuario autenticado (pacientes, doctores, admins)
 * IMPORTANTE: debe ir antes de /:id para evitar conflictos
 */
router.get('/doctor/:doctorId', autenticacion_1.autenticarJWT, TranslationMiddleware_1.translationMiddleware, formacionAcademicaController.obtenerPorDoctor);
/**
 * GET /formaciones-academicas/:id
 * Obtener una formación académica por ID
 * Acceso: cualquier usuario autenticado (sin restricción de rol)
 */
router.get('/:id', autenticacion_1.autenticarJWT, TranslationMiddleware_1.translationMiddleware, formacionAcademicaController.obtenerPorId);
// Actualizar una formación académica (solo el Doctor propietario)
router.put('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), formacionAcademicaController.actualizar);
// Eliminar una formación académica (solo el Doctor propietario)
router.delete('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), formacionAcademicaController.eliminar);
exports.default = router;
