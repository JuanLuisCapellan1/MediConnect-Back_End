import { Router } from 'express';
import { BarriosController } from '../controllers/BarriosController';
import { translationMiddleware } from '../middlewares/TranslationMiddleware';

const routerBarrios = Router();
const controlador = new BarriosController();

routerBarrios.get('/', translationMiddleware, (req, res) => controlador.listarTodos(req, res));
routerBarrios.get('/estado/:estado', translationMiddleware, (req, res) => controlador.buscarPorEstado(req, res));
routerBarrios.get('/seccion/:seccionId', translationMiddleware, (req, res) => controlador.buscarPorSeccion(req, res));
routerBarrios.get('/nombre/:nombre/:seccionId/:estado', translationMiddleware, (req, res) => controlador.buscarPorNombre(req, res));
routerBarrios.get('/:id', translationMiddleware, (req, res) => controlador.buscarPorId(req, res));
routerBarrios.post('/', (req, res) => controlador.crear(req, res));
routerBarrios.put('/:id', (req, res) => controlador.actualizar(req, res));
routerBarrios.delete('/:id', (req, res) => controlador.eliminar(req, res));

export default routerBarrios;
