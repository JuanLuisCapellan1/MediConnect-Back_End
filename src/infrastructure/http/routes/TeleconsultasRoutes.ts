import { Router } from 'express';
import { container } from 'tsyringe';
import { TeleconsultaController } from '../controllers/TeleconsultaController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

const ctrl = () => container.resolve(TeleconsultaController);

// ── POST /teleconsultas/:citaId/iniciar ───────────────────────────────────────
// Solo el Doctor dueño de la cita puede iniciar la teleconsulta.
// Crea la sala en Daily.co, registra el LogTeleconsulta y retorna la URL.
router.post(
    '/:citaId/iniciar',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => ctrl().iniciar(req, res),
);

// ── POST /teleconsultas/:citaId/finalizar ─────────────────────────────────────
// Tanto el Doctor como el Paciente pueden colgar la llamada.
// Calcula duración, actualiza LogTeleconsulta, destruye la sala Daily.co
// y emite evento WebSocket 'llamada-finalizada'.
router.post(
    '/:citaId/finalizar',
    autenticarJWT,
    (req, res) => ctrl().finalizar(req, res),
);

export default router;
