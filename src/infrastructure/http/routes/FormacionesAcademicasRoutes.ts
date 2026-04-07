import { Router } from 'express';
import { container } from 'tsyringe';
import { FormacionAcademicaController } from '../controllers/FormacionAcademicaController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';
import { translationMiddleware } from '../middlewares/TranslationMiddleware';

const router = Router();
const formacionAcademicaController = container.resolve(FormacionAcademicaController);

// Crear una nueva formación académica (solo Doctor)
router.post(
    '/',
    autenticarJWT,
    requireRole('Doctor'),
    formacionAcademicaController.crear
);

// Obtener todas las formaciones académicas del doctor autenticado (solo Doctor)
router.get(
    '/',
    autenticarJWT,
    requireRole('Doctor'),
    translationMiddleware,
    formacionAcademicaController.obtenerTodos
);

/**
 * GET /formaciones-academicas/doctor/:doctorId
 * Obtener formaciones activas de un doctor específico
 * Acceso: cualquier usuario autenticado (pacientes, doctores, admins)
 * IMPORTANTE: debe ir antes de /:id para evitar conflictos
 */
router.get(
    '/doctor/:doctorId',
    autenticarJWT,
    translationMiddleware,
    formacionAcademicaController.obtenerPorDoctor
);

/**
 * GET /formaciones-academicas/:id
 * Obtener una formación académica por ID
 * Acceso: cualquier usuario autenticado (sin restricción de rol)
 */
router.get(
    '/:id',
    autenticarJWT,
    translationMiddleware,
    formacionAcademicaController.obtenerPorId
);

// Actualizar una formación académica (solo el Doctor propietario)
router.put(
    '/:id',
    autenticarJWT,
    requireRole('Doctor'),
    formacionAcademicaController.actualizar
);

// Eliminar una formación académica (solo el Doctor propietario)
router.delete(
    '/:id',
    autenticarJWT,
    requireRole('Doctor'),
    formacionAcademicaController.eliminar
);

export default router;
