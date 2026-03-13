"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BusquedaController_1 = require("../controllers/BusquedaController");
const OptionalAuthMiddleware_1 = require("../middlewares/OptionalAuthMiddleware");
const router = (0, express_1.Router)();
const controller = new BusquedaController_1.BusquedaController();
/**
 * GET /busqueda/cercanos
 * Busca doctores y centros de salud de forma unificada, con o sin filtro geográfico.
 * Auth es opcional: si hay token y rol Paciente, se calcula esFavorito.
 */
router.get('/cercanos', OptionalAuthMiddleware_1.optionalAuth, (req, res) => controller.cercanos(req, res));
exports.default = router;
