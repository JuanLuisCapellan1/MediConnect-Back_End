import { Router } from 'express';
import { container } from 'tsyringe';
import { PaisController } from '../controllers/PaisController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();
const paisController = container.resolve(PaisController);

// Obtener todos los países (público)
router.get(
    '/',
    paisController.obtenerTodos
);

// Obtener un país por ID (público)
router.get(
    '/:id',
    paisController.obtenerPorId
);

// Crear un nuevo país (requiere autenticación como Admin)
router.post(
    '/',
    autenticarJWT,
    requireRole('Admin'),
    paisController.crear
);

// Actualizar un país (requiere autenticación como Admin)
router.put(
    '/:id',
    autenticarJWT,
    requireRole('Admin'),
    paisController.actualizar
);

// Eliminar un país (requiere autenticación como Admin)
router.delete(
    '/:id',
    autenticarJWT,
    requireRole('Admin'),
    paisController.eliminar
);

export default router;
