import { Router } from 'express';
import { PacienteController } from '../controllers/PacienteController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';
import { translationMiddleware } from '../middlewares/TranslationMiddleware';

const router = Router();
const pacienteController = new PacienteController();

/**
 * GET /pacientes
 * Listar pacientes (solo Admin)
 */
router.get(
    '/',
    autenticarJWT,
    requireRole('Admin'),
    translationMiddleware,
    (req, res) => pacienteController.listar(req, res)
);

// ─── Vista para Administrador ──────────────────────────────────────────────────
/**
 * GET /pacientes/admin
 * Listar todos los pacientes (Administrador) — sin datos médicos sensibles
 */
router.get(
    '/admin',
    autenticarJWT,
    requireRole('Administrador'),
    translationMiddleware,
    (req, res) => pacienteController.listarParaAdmin(req, res)
);

/**
 * GET /pacientes/admin/:id
 * Obtener datos de un paciente por ID (Administrador) — sin datos médicos sensibles
 */
router.get(
    '/admin/:id',
    autenticarJWT,
    requireRole('Administrador'),
    translationMiddleware,
    (req, res) => pacienteController.obtenerParaAdmin(req, res)
);

/**
 * GET /pacientes/me
 * Obtener perfil del paciente autenticado
 */
router.get(
    '/me',
    autenticarJWT,
    requireRole('Paciente'),
    translationMiddleware,
    (req, res) => pacienteController.obtenerPerfil(req, res)
);

/**
 * GET /pacientes/:id
 * Obtener paciente por ID (solo Admin)
 */
router.get(
    '/:id',
    autenticarJWT,
    requireRole('Admin'),
    translationMiddleware,
    (req, res) => pacienteController.obtenerPorId(req, res)
);

/**
 * PATCH /pacientes/me
 * Actualizar perfil del paciente autenticado
 */
router.patch(
    '/me',
    autenticarJWT,
    requireRole('Paciente'),
    (req, res) => pacienteController.actualizarPerfil(req, res)
);

/**
 * PATCH /pacientes/:id
 * Actualizar paciente por ID (solo Admin)
 */
router.patch(
    '/:id',
    autenticarJWT,
    requireRole('Admin'),
    (req, res) => pacienteController.actualizar(req, res)
);

/**
 * DELETE /pacientes/:id
 * Eliminar paciente (solo Admin)
 */
router.delete(
    '/:id',
    autenticarJWT,
    requireRole('Admin'),
    (req, res) => pacienteController.eliminar(req, res)
);

export default router;
