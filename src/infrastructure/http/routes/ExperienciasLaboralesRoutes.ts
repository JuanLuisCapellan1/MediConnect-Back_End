import { Router } from 'express';
import { container } from 'tsyringe';
import { ExperienciaLaboralController } from '../controllers/ExperienciaLaboralController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';
import { translationMiddleware } from '../middlewares/TranslationMiddleware';

const router = Router();
const experienciaLaboralController = container.resolve(ExperienciaLaboralController);

/**
 * POST /experiencias-laborales
 * Crear una nueva experiencia laboral (solo Doctor)
 */
router.post(
    '/',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => experienciaLaboralController.crear(req, res)
);

/**
 * GET /experiencias-laborales
 * Obtener todas las experiencias laborales del doctor autenticado (solo Doctor)
 */
router.get(
    '/',
    autenticarJWT,
    requireRole('Doctor'),
    translationMiddleware,
    (req, res) => experienciaLaboralController.obtenerTodos(req, res)
);

/**
 * GET /experiencias-laborales/doctor/:doctorId
 * Obtener todas las experiencias laborales activas de un doctor específico
 * Acceso: cualquier usuario autenticado (pacientes, doctores, admins)
 * IMPORTANTE: debe ir antes de /:id para evitar conflictos
 */
router.get(
    '/doctor/:doctorId',
    autenticarJWT,
    translationMiddleware,
    (req, res) => experienciaLaboralController.obtenerPorDoctor(req, res)
);

/**
 * GET /experiencias-laborales/:id
 * Obtener una experiencia laboral por ID
 * Acceso: cualquier usuario autenticado (sin restricción de rol)
 */
router.get(
    '/:id',
    autenticarJWT,
    translationMiddleware,
    (req, res) => experienciaLaboralController.obtenerPorId(req, res)
);

/**
 * PUT /experiencias-laborales/:id
 * Actualizar una experiencia laboral (solo el Doctor propietario)
 */
router.put(
    '/:id',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => experienciaLaboralController.actualizar(req, res)
);

/**
 * DELETE /experiencias-laborales/:id
 * Eliminar (soft delete) una experiencia laboral (solo el Doctor propietario)
 */
router.delete(
    '/:id',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => experienciaLaboralController.eliminar(req, res)
);

export default router;
