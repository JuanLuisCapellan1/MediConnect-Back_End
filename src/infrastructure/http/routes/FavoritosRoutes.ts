/**
 * FavoritosRoutes.ts
 * Rutas HTTP para gestión de doctores favoritos de un paciente.
 * Acceso: solo Paciente
 */

import { Router } from 'express';
import { container } from 'tsyringe';
import { FavoritosController } from '../controllers/FavoritosController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';
import { translationMiddleware } from '../middlewares/TranslationMiddleware';

const router = Router();
const favoritosController = container.resolve(FavoritosController);

// Autenticación requerida en todas las rutas
router.use(autenticarJWT);

/**
 * @route GET /favoritos
 * @description Lista los doctores favoritos del paciente autenticado
 * @access Paciente
 */
router.get(
    '/',
    requireRole('Paciente'),
    translationMiddleware,
    (req, res) => favoritosController.listar(req, res)
);

/**
 * @route POST /favoritos/:doctorId
 * @description Agrega un doctor a la lista de favoritos
 * @access Paciente
 */
router.post(
    '/:doctorId',
    requireRole('Paciente'),
    (req, res) => favoritosController.agregar(req, res)
);

/**
 * @route DELETE /favoritos/:doctorId
 * @description Elimina un doctor de la lista de favoritos
 * @access Paciente
 */
router.delete(
    '/:doctorId',
    requireRole('Paciente'),
    (req, res) => favoritosController.eliminar(req, res)
);

export default router;
