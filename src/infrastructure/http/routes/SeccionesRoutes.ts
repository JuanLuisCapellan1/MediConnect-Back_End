import { Router } from 'express';
import { container } from 'tsyringe';
import { SeccionesController } from '../controllers/SeccionesController';

const router = Router();
const seccionesController = container.resolve(SeccionesController);

// GET endpoints
router.get('/', (req, res) => seccionesController.obtenerTodas(req, res));

router.get('/por-estado', (req, res) =>
  seccionesController.buscarPorEstado(req, res)
);

router.get('/por-nombre', (req, res) =>
  seccionesController.buscarPorNombre(req, res)
);

router.get('/por-distrito/:distritoMunicipalId', (req, res) =>
  seccionesController.obtenerPorDistrito(req, res)
);

router.get('/:id', (req, res) => seccionesController.obtenerPorId(req, res));

// POST endpoint
router.post('/', (req, res) => seccionesController.crear(req, res));

// PUT endpoint
router.put('/:id', (req, res) => seccionesController.actualizar(req, res));

// DELETE endpoint
router.delete('/:id', (req, res) => seccionesController.eliminar(req, res));

export default router;
