import { Router } from 'express';
import { BusquedaController } from '../controllers/BusquedaController';
import { optionalAuth } from '../middlewares/OptionalAuthMiddleware';

const router = Router();
const controller = new BusquedaController();

/**
 * GET /busqueda/cercanos
 * Busca doctores y centros de salud de forma unificada, con o sin filtro geográfico.
 * Auth es opcional: si hay token y rol Paciente, se calcula esFavorito.
 */
router.get(
    '/cercanos',
    optionalAuth,
    (req, res) => controller.cercanos(req, res),
);

export default router;
