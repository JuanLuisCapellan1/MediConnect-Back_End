"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SeguroMedicoController_1 = require("../controllers/SeguroMedicoController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const TranslationMiddleware_1 = require("../middlewares/TranslationMiddleware");
const routerSeguros = (0, express_1.Router)();
const controller = new SeguroMedicoController_1.SeguroMedicoController();
// ============================================
// Admin - CRUD completo
// ============================================
routerSeguros.post('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => controller.crear(req, res));
routerSeguros.get('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), TranslationMiddleware_1.translationMiddleware, (req, res) => controller.obtenerTodos(req, res));
routerSeguros.patch('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => controller.actualizar(req, res));
routerSeguros.delete('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => controller.eliminar(req, res));
// ============================================
// Público (autenticado) - Ver seguros disponibles
// ============================================
/**
 * GET /api/seguros/disponibles
 * Ver todos los seguros activos (pacientes, doctores, etc.)
 */
routerSeguros.get('/disponibles', autenticacion_1.autenticarJWT, TranslationMiddleware_1.translationMiddleware, (req, res) => controller.obtenerSegurosDisponibles(req, res));
/**
 * GET /api/seguros/mas-utilizados
 * Ver el ranking de los seguros más utilizados por pacientes (cualquier usuario autenticado)
 */
routerSeguros.get('/mas-utilizados', autenticacion_1.autenticarJWT, TranslationMiddleware_1.translationMiddleware, (req, res) => controller.masUtilizados(req, res));
// ============================================
// Público - Ver seguros aceptados de un doctor
// IMPORTANTE: antes de /mis-seguros y /seguros-aceptados para evitar conflictos
// ============================================
/**
 * GET /api/seguros/doctor/:doctorId/seguros-aceptados
 * Ver los seguros que acepta un doctor (cualquier usuario autenticado)
 */
routerSeguros.get('/doctor/:doctorId/seguros-aceptados', autenticacion_1.autenticarJWT, TranslationMiddleware_1.translationMiddleware, (req, res) => controller.obtenerSegurosAceptadosPorDoctor(req, res));
/**
 * GET /api/seguros/verificar-compatibilidad/:seguroId/:tipoSeguroId/doctor/:doctorId
 * Verifica compatibilidad de un seguro+plan entre el paciente autenticado y un doctor.
 * - doctorAcepta: el doctor tiene ese seguro+plan activo
 * - pacienteTiene: el paciente autenticado tiene ese seguro+plan activo
 * - compatible: ambos son true
 */
routerSeguros.get('/verificar-compatibilidad/:seguroId/:tipoSeguroId/doctor/:doctorId', autenticacion_1.autenticarJWT, TranslationMiddleware_1.translationMiddleware, (req, res) => controller.verificarCompatibilidad(req, res));
// ============================================
// Paciente - Gestión de seguros (máximo 3)
// ============================================
routerSeguros.post('/mis-seguros', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => controller.agregarMiSeguro(req, res));
routerSeguros.get('/mis-seguros', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), TranslationMiddleware_1.translationMiddleware, (req, res) => controller.obtenerMisSeguros(req, res));
routerSeguros.delete('/mis-seguros/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => controller.eliminarMiSeguro(req, res));
// ============================================
// Doctor - Gestión de seguros aceptados
// ============================================
routerSeguros.post('/seguros-aceptados', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => controller.agregarSeguroAceptado(req, res));
routerSeguros.get('/seguros-aceptados', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), TranslationMiddleware_1.translationMiddleware, (req, res) => controller.obtenerSegurosAceptados(req, res));
routerSeguros.delete('/seguros-aceptados/:seguroId/:tipoSeguroId', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => controller.eliminarSeguroAceptado(req, res));
exports.default = routerSeguros;
