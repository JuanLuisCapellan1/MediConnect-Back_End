import { Router } from 'express';
import { container } from 'tsyringe';
import { EspecialidadController } from '../controllers/EspecialidadController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';

const especialidadesRouter = Router();
const controller = container.resolve(EspecialidadController);

// ============================================
// Público - Solo lectura de especialidades activas
// ============================================

especialidadesRouter.get('/', (req, res) => controller.listar(req, res));
especialidadesRouter.get('/:id', (req, res) => controller.obtener(req, res));

// ============================================
// Admin - CRUD completo (Soft Delete incluido)
// ============================================

especialidadesRouter.post(
    '/',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.crear(req, res)
);

especialidadesRouter.patch(
    '/:id',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.actualizar(req, res)
);

especialidadesRouter.delete(
    '/:id',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.eliminar(req, res)
);

export default especialidadesRouter;
