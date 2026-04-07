import { Router } from 'express';
import { container } from 'tsyringe';
import { TipoCentroSaludController } from '../controllers/TipoCentroSaludController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';

const tiposCentrosSaludRouter = Router();
const controller = container.resolve(TipoCentroSaludController);

// ============================================
// Público - Solo lectura de tipos activos
// ============================================

tiposCentrosSaludRouter.get('/', (req, res) => controller.listar(req, res));
tiposCentrosSaludRouter.get('/:id', (req, res) => controller.obtener(req, res));

// ============================================
// Admin - CRUD completo (Soft Delete incluido)
// ============================================

tiposCentrosSaludRouter.post(
    '/',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.crear(req, res)
);

tiposCentrosSaludRouter.put(
    '/:id',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.actualizar(req, res)
);

tiposCentrosSaludRouter.delete(
    '/:id',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.eliminar(req, res)
);

export default tiposCentrosSaludRouter;
