import { Router } from 'express';
import { DistritosMunicipalesController } from '../controllers/DistritosMunicipalesController';
import { translationMiddleware } from '../middlewares/TranslationMiddleware';

const routerDistritos = Router();
const controlador = new DistritosMunicipalesController();

routerDistritos.get('/', translationMiddleware, (req, res) => controlador.listarTodas(req, res));
routerDistritos.get('/estado/:estado', translationMiddleware, (req, res) => controlador.buscarPorEstado(req, res));
routerDistritos.get('/municipio/:municipioId', translationMiddleware, (req, res) => controlador.buscarPorMunicipio(req, res));
routerDistritos.get('/nombre/:nombre/:municipioId/:estado', translationMiddleware, (req, res) => controlador.buscarPorNombre(req, res));
routerDistritos.get('/:id', translationMiddleware, (req, res) => controlador.buscarPorId(req, res));
routerDistritos.post('/', (req, res) => controlador.crear(req, res));
routerDistritos.put('/:id', (req, res) => controlador.actualizar(req, res));
routerDistritos.delete('/:id', (req, res) => controlador.eliminar(req, res));

export default routerDistritos;
