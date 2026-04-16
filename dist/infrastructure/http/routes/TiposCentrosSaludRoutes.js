"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const TipoCentroSaludController_1 = require("../controllers/TipoCentroSaludController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const tiposCentrosSaludRouter = (0, express_1.Router)();
const controller = tsyringe_1.container.resolve(TipoCentroSaludController_1.TipoCentroSaludController);
// ============================================
// Público - Solo lectura de tipos activos
// ============================================
tiposCentrosSaludRouter.get('/', (req, res) => controller.listar(req, res));
tiposCentrosSaludRouter.get('/:id', (req, res) => controller.obtener(req, res));
// ============================================
// Admin - CRUD completo (Soft Delete incluido)
// ============================================
tiposCentrosSaludRouter.post('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => controller.crear(req, res));
tiposCentrosSaludRouter.put('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => controller.actualizar(req, res));
tiposCentrosSaludRouter.delete('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => controller.eliminar(req, res));
exports.default = tiposCentrosSaludRouter;
