import { Router } from 'express';
import { MunicipiosController } from '../controllers/MunicipiosController';
import { translationMiddleware } from '../middlewares/TranslationMiddleware';

const routerMunicipios = Router();
const controlador = new MunicipiosController();

routerMunicipios.get('/', translationMiddleware, (req, res) => controlador.listarTodas(req, res));
routerMunicipios.get('/estado/:estado', translationMiddleware, (req, res) => controlador.buscarPorEstado(req, res));
routerMunicipios.get('/provincia/:provinciaId', translationMiddleware, (req, res) => controlador.buscarPorProvincia(req, res));
routerMunicipios.get('/nombre/:nombre/:provinciaId/:estado', translationMiddleware, (req, res) => controlador.buscarPorNombre(req, res));
routerMunicipios.get('/:id', translationMiddleware, (req, res) => controlador.buscarPorId(req, res));
routerMunicipios.post('/', (req, res) => controlador.crear(req, res));
routerMunicipios.put('/:id', (req, res) => controlador.actualizar(req, res));
routerMunicipios.delete('/:id', (req, res) => controlador.eliminar(req, res));

export default routerMunicipios;
