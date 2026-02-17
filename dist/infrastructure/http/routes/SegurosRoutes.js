"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SeguroMedicoController_1 = require("../controllers/SeguroMedicoController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const routerSeguros = (0, express_1.Router)();
const controller = new SeguroMedicoController_1.SeguroMedicoController();
// ============================================
// Admin - CRUD completo
// ============================================
/**
 * POST /api/seguros
 * Crear un nuevo seguro médico (Solo Admin)
 */
routerSeguros.post('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => controller.crear(req, res));
/**
 * GET /api/seguros
 * Obtener todos los seguros (Solo Admin)
 */
routerSeguros.get('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => controller.obtenerTodos(req, res));
/**
 * PATCH /api/seguros/:id
 * Actualizar un seguro médico (Solo Admin)
 */
routerSeguros.patch('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => controller.actualizar(req, res));
/**
 * DELETE /api/seguros/:id
 * Eliminar (desactivar) un seguro médico (Solo Admin)
 */
routerSeguros.delete('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => controller.eliminar(req, res));
// ============================================
// Público (autenticado) - Ver seguros disponibles
// ============================================
/**
 * GET /api/seguros/disponibles
 * Ver todos los seguros disponibles (Pacientes y Doctores)
 */
routerSeguros.get('/disponibles', autenticacion_1.autenticarJWT, (req, res) => controller.obtenerSegurosDisponibles(req, res));
// ============================================
// Paciente - Gestión de seguros (máximo 3)
// ============================================
/**
 * POST /api/seguros/mis-seguros
 * Agregar un seguro al perfil del paciente (máximo 3)
 */
routerSeguros.post('/mis-seguros', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => controller.agregarMiSeguro(req, res));
/**
 * GET /api/seguros/mis-seguros
 * Obtener los seguros del paciente
 */
routerSeguros.get('/mis-seguros', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => controller.obtenerMisSeguros(req, res));
/**
 * DELETE /api/seguros/mis-seguros/:id
 * Eliminar un seguro del perfil del paciente
 */
routerSeguros.delete('/mis-seguros/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => controller.eliminarMiSeguro(req, res));
// ============================================
// Doctor - Gestión de seguros aceptados (ilimitado)
// ============================================
/**
 * POST /api/seguros/seguros-aceptados
 * Agregar un seguro a los seguros aceptados del doctor
 */
routerSeguros.post('/seguros-aceptados', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => controller.agregarSeguroAceptado(req, res));
/**
 * GET /api/seguros/seguros-aceptados
 * Obtener los seguros aceptados del doctor
 */
routerSeguros.get('/seguros-aceptados', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => controller.obtenerSegurosAceptados(req, res));
/**
 * DELETE /api/seguros/seguros-aceptados/:seguroId/:tipoSeguroId
 * Eliminar un seguro de los seguros aceptados del doctor
 */
routerSeguros.delete('/seguros-aceptados/:seguroId/:tipoSeguroId', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => controller.eliminarSeguroAceptado(req, res));
exports.default = routerSeguros;
