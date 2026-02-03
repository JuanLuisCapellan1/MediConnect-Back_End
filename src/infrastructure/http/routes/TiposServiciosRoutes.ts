import { Router } from 'express';
import { container } from 'tsyringe';
import { TipoServicioController } from '../controllers/TipoServicioController';

const tiposServiciosRouter = Router();
const controller = container.resolve(TipoServicioController);

tiposServiciosRouter.get('/', (req, res) => controller.listar(req, res));
tiposServiciosRouter.get('/:id', (req, res) => controller.obtener(req, res));
tiposServiciosRouter.post('/', (req, res) => controller.crear(req, res));
tiposServiciosRouter.put('/:id', (req, res) => controller.actualizar(req, res));
tiposServiciosRouter.delete('/:id', (req, res) => controller.eliminar(req, res));

export default tiposServiciosRouter;
