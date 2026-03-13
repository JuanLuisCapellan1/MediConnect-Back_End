"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const CitaController_1 = require("../controllers/CitaController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const TranslationMiddleware_1 = require("../middlewares/TranslationMiddleware");
const router = (0, express_1.Router)();
const ctrl = () => tsyringe_1.container.resolve(CitaController_1.CitaController);
// ── ESTÁTICAS (antes de /:id) ─────────────────────────────────────────
// GET /citas/historial — Historial del paciente
router.get('/historial', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), TranslationMiddleware_1.translationMiddleware, (req, res) => ctrl().historialPaciente(req, res));
// GET /citas/doctor — Doctor lista sus citas
router.get('/doctor', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), TranslationMiddleware_1.translationMiddleware, (req, res) => ctrl().listarCitasDoctor(req, res));
// GET /citas/calendario — Vista de calendario (Paciente o Doctor)
router.get('/calendario', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente', 'Doctor'), TranslationMiddleware_1.translationMiddleware, (req, res) => ctrl().calendario(req, res));
// GET /citas/mis-doctores — Paciente obtiene todos los doctores con quienes ha tenido citas
router.get('/mis-doctores', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), TranslationMiddleware_1.translationMiddleware, (req, res) => ctrl().misDoctores(req, res));
// GET /citas/mis-pacientes — Doctor obtiene todos sus pacientes con información detallada
router.get('/mis-pacientes', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), TranslationMiddleware_1.translationMiddleware, (req, res) => ctrl().listarMisPacientes(req, res));
// ── POST /citas ───────────────────────────────────────────────────────
// POST /citas — Paciente agenda una cita
router.post('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => ctrl().agendar(req, res));
// ── LISTAR ────────────────────────────────────────────────────────────
// GET /citas — Paciente lista sus citas
router.get('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), TranslationMiddleware_1.translationMiddleware, (req, res) => ctrl().listarMisCitas(req, res));
// ── RUTAS CON :id ────────────────────────────────────────────────────
// GET /citas/:id — Detalle (Paciente o Doctor)
router.get('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente', 'Doctor'), TranslationMiddleware_1.translationMiddleware, (req, res) => ctrl().obtenerDetalle(req, res));
// GET /citas/:id/historial — Historial de una cita
router.get('/:id/historial', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente', 'Doctor'), (req, res) => ctrl().historialCita(req, res));
// PATCH /citas/:id — Paciente edita su cita
router.patch('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => ctrl().editar(req, res));
// PATCH /citas/:id/cancelar — Cancelar (Paciente o Doctor)
router.patch('/:id/cancelar', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente', 'Doctor'), (req, res) => ctrl().cancelar(req, res));
// PATCH /citas/:id/reprogramar — Doctor reprograma
router.patch('/:id/reprogramar', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => ctrl().reprogramar(req, res));
// POST /citas/:id/diagnosticar — Doctor diagnostica y completa
router.post('/:id/diagnosticar', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => ctrl().diagnosticar(req, res));
exports.default = router;
