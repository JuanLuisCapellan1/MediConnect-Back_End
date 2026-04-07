"use strict";
/**
 * FavoritosRoutes.ts
 * Rutas HTTP para gestión de doctores favoritos de un paciente.
 * Acceso: solo Paciente
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const FavoritosController_1 = require("../controllers/FavoritosController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const TranslationMiddleware_1 = require("../middlewares/TranslationMiddleware");
const router = (0, express_1.Router)();
const favoritosController = tsyringe_1.container.resolve(FavoritosController_1.FavoritosController);
// Autenticación requerida en todas las rutas
router.use(autenticacion_1.autenticarJWT);
/**
 * @route GET /favoritos
 * @description Lista los doctores favoritos del paciente autenticado
 * @access Paciente
 */
router.get('/', (0, roleMiddleware_1.requireRole)('Paciente'), TranslationMiddleware_1.translationMiddleware, (req, res) => favoritosController.listar(req, res));
/**
 * @route POST /favoritos/:doctorId
 * @description Agrega un doctor a la lista de favoritos
 * @access Paciente
 */
router.post('/:doctorId', (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => favoritosController.agregar(req, res));
/**
 * @route DELETE /favoritos/:doctorId
 * @description Elimina un doctor de la lista de favoritos
 * @access Paciente
 */
router.delete('/:doctorId', (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => favoritosController.eliminar(req, res));
exports.default = router;
