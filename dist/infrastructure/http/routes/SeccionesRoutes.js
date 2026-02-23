"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const SeccionesController_1 = require("../controllers/SeccionesController");
const TranslationMiddleware_1 = require("../middlewares/TranslationMiddleware");
const router = (0, express_1.Router)();
const seccionesController = tsyringe_1.container.resolve(SeccionesController_1.SeccionesController);
// GET endpoints
router.get('/', TranslationMiddleware_1.translationMiddleware, (req, res) => seccionesController.obtenerTodas(req, res));
router.get('/por-estado', TranslationMiddleware_1.translationMiddleware, (req, res) => seccionesController.buscarPorEstado(req, res));
router.get('/por-nombre', TranslationMiddleware_1.translationMiddleware, (req, res) => seccionesController.buscarPorNombre(req, res));
router.get('/por-distrito/:distritoMunicipalId', TranslationMiddleware_1.translationMiddleware, (req, res) => seccionesController.obtenerPorDistrito(req, res));
// NUEVA: filtrar secciones por municipioId (incluye secciones sin distrito asignado)
router.get('/por-municipio/:municipioId', TranslationMiddleware_1.translationMiddleware, (req, res) => seccionesController.obtenerPorMunicipio(req, res));
router.get('/:id', TranslationMiddleware_1.translationMiddleware, (req, res) => seccionesController.obtenerPorId(req, res));
// POST endpoint
router.post('/', (req, res) => seccionesController.crear(req, res));
// PUT endpoint
router.put('/:id', (req, res) => seccionesController.actualizar(req, res));
// DELETE endpoint
router.delete('/:id', (req, res) => seccionesController.eliminar(req, res));
exports.default = router;
