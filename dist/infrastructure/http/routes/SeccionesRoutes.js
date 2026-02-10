"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const SeccionesController_1 = require("../controllers/SeccionesController");
const router = (0, express_1.Router)();
const seccionesController = tsyringe_1.container.resolve(SeccionesController_1.SeccionesController);
// GET endpoints
router.get('/', (req, res) => seccionesController.obtenerTodas(req, res));
router.get('/por-estado', (req, res) => seccionesController.buscarPorEstado(req, res));
router.get('/por-nombre', (req, res) => seccionesController.buscarPorNombre(req, res));
router.get('/por-distrito/:distritoMunicipalId', (req, res) => seccionesController.obtenerPorDistrito(req, res));
router.get('/:id', (req, res) => seccionesController.obtenerPorId(req, res));
// POST endpoint
router.post('/', (req, res) => seccionesController.crear(req, res));
// PUT endpoint
router.put('/:id', (req, res) => seccionesController.actualizar(req, res));
// DELETE endpoint
router.delete('/:id', (req, res) => seccionesController.eliminar(req, res));
exports.default = router;
