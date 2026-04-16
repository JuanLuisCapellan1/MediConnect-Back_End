"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const EspecialidadController_1 = require("../controllers/EspecialidadController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const especialidadesRouter = (0, express_1.Router)();
const controller = tsyringe_1.container.resolve(EspecialidadController_1.EspecialidadController);
// ============================================
// Público - Solo lectura de especialidades activas
// ============================================
especialidadesRouter.get('/', (req, res) => controller.listar(req, res));
especialidadesRouter.get('/:id', (req, res) => controller.obtener(req, res));
// ============================================
// Admin - CRUD completo (Soft Delete incluido)
// ============================================
especialidadesRouter.post('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => controller.crear(req, res));
especialidadesRouter.patch('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => controller.actualizar(req, res));
especialidadesRouter.delete('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => controller.eliminar(req, res));
exports.default = especialidadesRouter;
