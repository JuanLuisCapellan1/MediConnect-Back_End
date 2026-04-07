"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const TeleconsultaController_1 = require("../controllers/TeleconsultaController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const router = (0, express_1.Router)();
const ctrl = () => tsyringe_1.container.resolve(TeleconsultaController_1.TeleconsultaController);
// ── POST /teleconsultas/:citaId/iniciar ───────────────────────────────────────
// Solo el Doctor dueño de la cita puede iniciar la teleconsulta.
// Crea la sala en Daily.co, registra el LogTeleconsulta y retorna la URL.
router.post('/:citaId/iniciar', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => ctrl().iniciar(req, res));
// ── POST /teleconsultas/:citaId/finalizar ─────────────────────────────────────
// Tanto el Doctor como el Paciente pueden colgar la llamada.
// Calcula duración, actualiza LogTeleconsulta, destruye la sala Daily.co
// y emite evento WebSocket 'llamada-finalizada'.
router.post('/:citaId/finalizar', autenticacion_1.autenticarJWT, (req, res) => ctrl().finalizar(req, res));
// ── GET /teleconsultas/:citaId/url-acceso ─────────────────────────────────────
// Solo el Paciente dueño de la cita puede obtener su URL de acceso con token.
// El doctor debe haber iniciado la sala previamente.
router.get('/:citaId/url-acceso', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => ctrl().obtenerUrlPaciente(req, res));
exports.default = router;
