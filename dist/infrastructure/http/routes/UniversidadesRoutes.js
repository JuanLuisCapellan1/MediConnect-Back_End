"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const UniversidadController_1 = require("../controllers/UniversidadController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const router = (0, express_1.Router)();
const universidadController = tsyringe_1.container.resolve(UniversidadController_1.UniversidadController);
// Obtener todas las universidades (público)
router.get('/', universidadController.obtenerTodos);
// Obtener universidades de un país específico (público)
router.get('/pais/:paisId', universidadController.obtenerPorPais);
// Obtener una universidad por ID (público)
router.get('/:id', universidadController.obtenerPorId);
// Crear una nueva universidad (requiere autenticación como Admin)
router.post('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Admin'), universidadController.crear);
// Actualizar una universidad (requiere autenticación como Admin)
router.put('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Admin'), universidadController.actualizar);
// Eliminar una universidad (requiere autenticación como Admin)
router.delete('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Admin'), universidadController.eliminar);
exports.default = router;
