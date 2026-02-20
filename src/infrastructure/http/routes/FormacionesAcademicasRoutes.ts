import { Router } from 'express';
import { container } from 'tsyringe';
import { FormacionAcademicaController } from '../controllers/FormacionAcademicaController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';
import { translationMiddleware } from '../middlewares/TranslationMiddleware';

const router = Router();
const formacionAcademicaController = container.resolve(FormacionAcademicaController);

// Crear una nueva formación académica (requiere autenticación como Doctor)
router.post(
    '/',
    autenticarJWT,
    requireRole('Doctor'),
    formacionAcademicaController.crear
);

// Obtener todas las formaciones académicas del doctor autenticado (con traducción)
router.get(
    '/',
    autenticarJWT,
    requireRole('Doctor'),
    translationMiddleware,
    formacionAcademicaController.obtenerTodos
);

// Obtener una formación académica por ID (solo si pertenece al doctor autenticado)
router.get(
    '/:id',
    autenticarJWT,
    requireRole('Doctor'),
    formacionAcademicaController.obtenerPorId
);

// Actualizar una formación académica (solo si pertenece al doctor autenticado)
router.put(
    '/:id',
    autenticarJWT,
    requireRole('Doctor'),
    formacionAcademicaController.actualizar
);

// Eliminar una formación académica (soft delete, solo si pertenece al doctor autenticado)
router.delete(
    '/:id',
    autenticarJWT,
    requireRole('Doctor'),
    formacionAcademicaController.eliminar
);

// ========== REFERENCIAS (Países y Universidades) ==========

// Obtener todos los países activos
router.get(
    '/referencias/paises',
    formacionAcademicaController.obtenerPaises
);

// Obtener todas las universidades activas de un país específico
router.get(
    '/referencias/universidades/:paisId',
    formacionAcademicaController.obtenerUniversidadesPorPais
);

export default router;
