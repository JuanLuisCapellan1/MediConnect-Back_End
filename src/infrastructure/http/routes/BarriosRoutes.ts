import { Router } from 'express';
import { BarriosController } from '../controllers/BarriosController';

const routerBarrios = Router();

const controlador = new BarriosController();

routerBarrios.get('/', (req, res) => controlador.listarTodos(req, res));
routerBarrios.get('/estado/:estado', (req, res) => controlador.buscarPorEstado(req, res));
routerBarrios.get('/seccion/:seccionId', (req, res) => controlador.buscarPorSeccion(req, res));
routerBarrios.get('/nombre/:nombre/:seccionId/:estado', (req, res) => controlador.buscarPorNombre(req, res));
routerBarrios.get('/:id', (req, res) => controlador.buscarPorId(req, res));
routerBarrios.post('/', (req, res) => controlador.crear(req, res));
routerBarrios.put('/:id', (req, res) => controlador.actualizar(req, res));
routerBarrios.delete('/:id', (req, res) => controlador.eliminar(req, res));

export default routerBarrios;
