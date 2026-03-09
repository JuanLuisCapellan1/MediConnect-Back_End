import { Router } from 'express';
import { container } from 'tsyringe';
import { CitaController } from '../controllers/CitaController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

const ctrl = () => container.resolve(CitaController);

// ── ESTÁTICAS (antes de /:id) ─────────────────────────────────────────

// GET /citas/historial — Historial del paciente
router.get('/historial', autenticarJWT, requireRole('Paciente'), (req, res) => ctrl().historialPaciente(req, res));

// GET /citas/doctor — Doctor lista sus citas
router.get('/doctor', autenticarJWT, requireRole('Doctor'), (req, res) => ctrl().listarCitasDoctor(req, res));

// GET /citas/calendario — Vista de calendario (Paciente o Doctor)
router.get('/calendario', autenticarJWT, requireRole('Paciente', 'Doctor'), (req, res) => ctrl().calendario(req, res));

// ── POST /citas ───────────────────────────────────────────────────────

// POST /citas — Paciente agenda una cita
router.post('/', autenticarJWT, requireRole('Paciente'), (req, res) => ctrl().agendar(req, res));

// ── LISTAR ────────────────────────────────────────────────────────────

// GET /citas — Paciente lista sus citas
router.get('/', autenticarJWT, requireRole('Paciente'), (req, res) => ctrl().listarMisCitas(req, res));

// ── RUTAS CON :id ────────────────────────────────────────────────────

// GET /citas/:id — Detalle (Paciente o Doctor)
router.get('/:id', autenticarJWT, requireRole('Paciente', 'Doctor'), (req, res) => ctrl().obtenerDetalle(req, res));

// GET /citas/:id/historial — Historial de una cita
router.get('/:id/historial', autenticarJWT, requireRole('Paciente', 'Doctor'), (req, res) => ctrl().historialCita(req, res));

// PATCH /citas/:id — Paciente edita su cita
router.patch('/:id', autenticarJWT, requireRole('Paciente'), (req, res) => ctrl().editar(req, res));

// PATCH /citas/:id/cancelar — Cancelar (Paciente o Doctor)
router.patch('/:id/cancelar', autenticarJWT, requireRole('Paciente', 'Doctor'), (req, res) => ctrl().cancelar(req, res));

// PATCH /citas/:id/reprogramar — Doctor reprograma
router.patch('/:id/reprogramar', autenticarJWT, requireRole('Doctor'), (req, res) => ctrl().reprogramar(req, res));

// POST /citas/:id/diagnosticar — Doctor diagnostica y completa
router.post('/:id/diagnosticar', autenticarJWT, requireRole('Doctor'), (req, res) => ctrl().diagnosticar(req, res));

export default router;
