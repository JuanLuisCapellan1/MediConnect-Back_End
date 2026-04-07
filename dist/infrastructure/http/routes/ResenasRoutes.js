"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const ResenaController_1 = require("../controllers/ResenaController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const router = (0, express_1.Router)();
const ctrl = () => tsyringe_1.container.resolve(ResenaController_1.ResenaController);
// POST /resenas — Paciente crea una reseña
router.post('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => ctrl().crear(req, res));
// GET /resenas/mis-resenas — Reseñas del paciente autenticado (antes de /:id)
router.get('/mis-resenas', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => ctrl().misResenas(req, res));
// GET /resenas/servicio/:servicioId — Público
router.get('/servicio/:servicioId', (req, res) => ctrl().listarPorServicio(req, res));
// GET /resenas/doctor/:doctorId — Público
router.get('/doctor/:doctorId', (req, res) => ctrl().listarPorDoctor(req, res));
// DELETE /resenas/:id — Paciente elimina su reseña
router.delete('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => ctrl().eliminar(req, res));
exports.default = router;
