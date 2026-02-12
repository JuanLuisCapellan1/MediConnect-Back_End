import { Router } from 'express';
import { DoctorController } from '../controllers/DoctorController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();
const doctorController = new DoctorController();

/**
 * GET /doctores
 * Listar doctores (solo Admin)
 */
router.get(
    '/',
    autenticarJWT,
    requireRole('Admin'),
    (req, res) => doctorController.listar(req, res)
);

/**
 * GET /doctores/me
 * Obtener perfil del doctor autenticado
 */
router.get(
    '/me',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => doctorController.obtenerPerfil(req, res)
);

/**
 * GET /doctores/:id
 * Obtener doctor por ID (solo Admin)
 */
router.get(
    '/:id',
    autenticarJWT,
    requireRole('Admin'),
    (req, res) => doctorController.obtenerPorId(req, res)
);

/**
 * PATCH /doctores/me
 * Actualizar perfil del doctor autenticado
 */
router.patch(
    '/me',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => doctorController.actualizarPerfil(req, res)
);

/**
 * PATCH /doctores/:id
 * Actualizar doctor por ID (solo Admin)
 */
router.patch(
    '/:id',
    autenticarJWT,
    requireRole('Admin'),
    (req, res) => doctorController.actualizar(req, res)
);

/**
 * DELETE /doctores/:id
 * Eliminar doctor (solo Admin)
 */
router.delete(
    '/:id',
    autenticarJWT,
    requireRole('Admin'),
    (req, res) => doctorController.eliminar(req, res)
);

export default router;
