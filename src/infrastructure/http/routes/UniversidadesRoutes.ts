import { Router } from 'express';
import { container } from 'tsyringe';
import { UniversidadController } from '../controllers/UniversidadController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();
const universidadController = container.resolve(UniversidadController);

// Obtener todas las universidades (público)
router.get(
    '/',
    universidadController.obtenerTodos
);

// Obtener universidades de un país específico (público)
router.get(
    '/pais/:paisId',
    universidadController.obtenerPorPais
);

// Obtener una universidad por ID (público)
router.get(
    '/:id',
    universidadController.obtenerPorId
);

// Crear una nueva universidad (requiere autenticación como Admin)
router.post(
    '/',
    autenticarJWT,
    requireRole('Admin'),
    universidadController.crear
);

// Actualizar una universidad (requiere autenticación como Admin)
router.put(
    '/:id',
    autenticarJWT,
    requireRole('Admin'),
    universidadController.actualizar
);

// Eliminar una universidad (requiere autenticación como Admin)
router.delete(
    '/:id',
    autenticarJWT,
    requireRole('Admin'),
    universidadController.eliminar
);

export default router;
