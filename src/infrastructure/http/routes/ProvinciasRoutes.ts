import { Router } from 'express';
import { ProvinciasController } from '../controllers/ProvinciasController';
import { translationMiddleware } from '../middlewares/TranslationMiddleware';

const routerProvincias = Router();
const controlador = new ProvinciasController();

routerProvincias.get('/', translationMiddleware, (req, res) => controlador.listarTodas(req, res));
routerProvincias.get('/estado/:estado', translationMiddleware, (req, res) => controlador.buscarPorEstado(req, res));
routerProvincias.get('/nombre/:nombre/:estado', translationMiddleware, (req, res) => controlador.buscarPorNombre(req, res));
routerProvincias.get('/:id', translationMiddleware, (req, res) => controlador.buscarPorId(req, res));
routerProvincias.post('/', (req, res) => controlador.crear(req, res));
routerProvincias.put('/:id', (req, res) => controlador.actualizar(req, res));
routerProvincias.delete('/:id', (req, res) => controlador.eliminar(req, res));

export default routerProvincias;
