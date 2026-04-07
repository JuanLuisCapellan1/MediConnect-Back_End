"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TipoSeguroController_1 = require("../controllers/TipoSeguroController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const routerTiposSeguros = (0, express_1.Router)();
const controller = new TipoSeguroController_1.TipoSeguroController();
// ============================================
// Admin - CRUD completo
// ============================================
/**
 * POST /api/tipos-seguros
 * Crear un nuevo tipo de seguro (Solo Admin)
 */
routerTiposSeguros.post('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => controller.crear(req, res));
/**
 * GET /api/tipos-seguros
 * Obtener todos los tipos de seguros con filtros (Solo Admin)
 */
routerTiposSeguros.get('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => controller.obtenerTodos(req, res));
// ============================================
// Público - Solo lectura de tipos activos
// ============================================
/**
 * GET /api/tipos-seguros/disponibles
 * Obtener tipos de seguros activos (Público/Autenticado)
 */
routerTiposSeguros.get('/disponibles', (req, res) => controller.obtenerActivos(req, res));
/**
 * GET /api/tipos-seguros/:id
 * Obtener un tipo de seguro por ID (Solo Admin)
 */
routerTiposSeguros.get('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => controller.obtenerPorId(req, res));
/**
 * PATCH /api/tipos-seguros/:id
 * Actualizar un tipo de seguro (Solo Admin)
 */
routerTiposSeguros.patch('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => controller.actualizar(req, res));
/**
 * DELETE /api/tipos-seguros/:id
 * Eliminar (soft delete) un tipo de seguro (Solo Admin)
 */
routerTiposSeguros.delete('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => controller.eliminar(req, res));
exports.default = routerTiposSeguros;
