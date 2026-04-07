import { Router } from 'express';
import { DoctorIdiomaController } from '../controllers/DoctorIdiomaController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';
import { translationMiddleware } from '../middlewares/TranslationMiddleware';

const router = Router();
const doctorIdiomaController = new DoctorIdiomaController();

/**
 * POST /doctores/idiomas
 * Agregar un idioma al doctor autenticado
 */
router.post(
    '/',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => doctorIdiomaController.agregar(req, res)
);

/**
 * GET /doctores/idiomas
 * Obtener todos los idiomas del doctor autenticado
 */
router.get(
    '/',
    autenticarJWT,
    requireRole('Doctor'),
    translationMiddleware,
    (req, res) => doctorIdiomaController.obtenerIdiomas(req, res)
);

/**
 * PATCH /doctores/idiomas/:id
 * Actualizar un idioma del doctor autenticado
 */
router.patch(
    '/:id',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => doctorIdiomaController.actualizar(req, res)
);

/**
 * DELETE /doctores/idiomas/:id
 * Eliminar un idioma del doctor autenticado
 */
router.delete(
    '/:id',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => doctorIdiomaController.eliminar(req, res)
);

export default router;
