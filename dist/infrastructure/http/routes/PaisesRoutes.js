"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const PaisController_1 = require("../controllers/PaisController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const router = (0, express_1.Router)();
const paisController = tsyringe_1.container.resolve(PaisController_1.PaisController);
// Obtener todos los países (público)
router.get('/', paisController.obtenerTodos);
// Obtener un país por ID (público)
router.get('/:id', paisController.obtenerPorId);
// Crear un nuevo país (requiere autenticación como Admin)
router.post('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Admin'), paisController.crear);
// Actualizar un país (requiere autenticación como Admin)
router.put('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Admin'), paisController.actualizar);
// Eliminar un país (requiere autenticación como Admin)
router.delete('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Admin'), paisController.eliminar);
exports.default = router;
