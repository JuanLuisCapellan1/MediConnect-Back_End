import { Router } from 'express';
import { container } from 'tsyringe';
import { ExperienciaLaboralController } from '../controllers/ExperienciaLaboralController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();
const experienciaLaboralController = container.resolve(ExperienciaLaboralController);

/**
 * POST /experiencias-laborales
 * Crear una nueva experiencia laboral (requiere autenticación como Doctor)
 */
router.post(
    '/',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => experienciaLaboralController.crear(req, res)
);

/**
 * GET /experiencias-laborales
 * Obtener todas las experiencias laborales del doctor autenticado
 */
router.get(
    '/',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => experienciaLaboralController.obtenerTodos(req, res)
);

/**
 * GET /experiencias-laborales/:id
 * Obtener una experiencia laboral por ID (con validación de propiedad)
 */
router.get(
    '/:id',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => experienciaLaboralController.obtenerPorId(req, res)
);

/**
 * PUT /experiencias-laborales/:id
 * Actualizar una experiencia laboral (con validación de propiedad)
 */
router.put(
    '/:id',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => experienciaLaboralController.actualizar(req, res)
);

/**
 * DELETE /experiencias-laborales/:id
 * Eliminar (soft delete) una experiencia laboral (con validación de propiedad)
 */
router.delete(
    '/:id',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => experienciaLaboralController.eliminar(req, res)
);

export default router;
