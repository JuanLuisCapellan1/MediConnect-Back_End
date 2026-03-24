import { Router } from 'express';
import { AccionesController } from '../controllers/AccionesController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();
const accionesController = new AccionesController();

/**
 * GET /acciones/pendientes
 * Listar todas las acciones pendientes de revisión de documentos (solo Admin)
 */
router.get(
    '/pendientes',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => accionesController.listarAccionesPendientes(req, res)
);

/**
 * GET /acciones/:id
 * Obtener detalle de una acción específica (solo Admin)
 */
router.get(
    '/:id',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => accionesController.obtenerDetalleAccion(req, res)
);

/**
 * PATCH /acciones/:id/revisar
 * Aprobar o rechazar un documento específico (solo Admin)
 * Body: { decision: 'Aprobada' | 'Rechazada', comentario?: string }
 */
router.patch(
    '/:id/revisar',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => accionesController.aprobarRechazarDocumento(req, res)
);

export default router;
