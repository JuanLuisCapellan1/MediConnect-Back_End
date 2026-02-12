import { Router } from 'express';
import { container } from 'tsyringe';
import { EspecialidadController } from '../controllers/EspecialidadController';

const especialidadesRouter = Router();
const controller = container.resolve(EspecialidadController);

especialidadesRouter.get('/', (req, res) => controller.listar(req, res));
especialidadesRouter.get('/:id', (req, res) => controller.obtener(req, res));
especialidadesRouter.post('/', (req, res) => controller.crear(req, res));
especialidadesRouter.patch('/:id', (req, res) => controller.actualizar(req, res));
especialidadesRouter.delete('/:id', (req, res) => controller.eliminar(req, res));

export default especialidadesRouter;
