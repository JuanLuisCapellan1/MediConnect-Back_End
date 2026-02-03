import { Router } from 'express';
import { container } from 'tsyringe';
import { TipoCentroSaludController } from '../controllers/TipoCentroSaludController';

const tiposCentrosSaludRouter = Router();
const controller = container.resolve(TipoCentroSaludController);

tiposCentrosSaludRouter.get('/', (req, res) => controller.listar(req, res));
tiposCentrosSaludRouter.get('/:id', (req, res) => controller.obtener(req, res));
tiposCentrosSaludRouter.post('/', (req, res) => controller.crear(req, res));
tiposCentrosSaludRouter.put('/:id', (req, res) => controller.actualizar(req, res));
tiposCentrosSaludRouter.delete('/:id', (req, res) => controller.eliminar(req, res));

export default tiposCentrosSaludRouter;
