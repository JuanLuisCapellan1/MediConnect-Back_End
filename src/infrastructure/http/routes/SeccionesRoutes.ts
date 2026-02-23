import { Router } from 'express';
import { container } from 'tsyringe';
import { SeccionesController } from '../controllers/SeccionesController';
import { translationMiddleware } from '../middlewares/TranslationMiddleware';

const router = Router();
const seccionesController = container.resolve(SeccionesController);

// GET endpoints
router.get('/', translationMiddleware, (req, res) =>
  seccionesController.obtenerTodas(req, res)
);

router.get('/por-estado', translationMiddleware, (req, res) =>
  seccionesController.buscarPorEstado(req, res)
);

router.get('/por-nombre', translationMiddleware, (req, res) =>
  seccionesController.buscarPorNombre(req, res)
);

router.get('/por-distrito/:distritoMunicipalId', translationMiddleware, (req, res) =>
  seccionesController.obtenerPorDistrito(req, res)
);

// NUEVA: filtrar secciones por municipioId (incluye secciones sin distrito asignado)
router.get('/por-municipio/:municipioId', translationMiddleware, (req, res) =>
  seccionesController.obtenerPorMunicipio(req, res)
);

router.get('/:id', translationMiddleware, (req, res) =>
  seccionesController.obtenerPorId(req, res)
);

// POST endpoint
router.post('/', (req, res) => seccionesController.crear(req, res));

// PUT endpoint
router.put('/:id', (req, res) => seccionesController.actualizar(req, res));

// DELETE endpoint
router.delete('/:id', (req, res) => seccionesController.eliminar(req, res));

export default router;
