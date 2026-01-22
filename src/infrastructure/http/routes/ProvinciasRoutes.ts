import { Router } from 'express';
import { ProvinciasController } from '../controllers/ProvinciasController';

const routerProvincias = Router();

const controlador = new ProvinciasController();

routerProvincias.get('/', (req, res) => controlador.listarTodas(req, res));
routerProvincias.get('/estado/:estado', (req, res) => controlador.buscarPorEstado(req, res));
routerProvincias.get('/nombre/:nombre/:estado', (req, res) => controlador.buscarPorNombre(req, res));
routerProvincias.get('/:id', (req, res) => controlador.buscarPorId(req, res));
routerProvincias.post('/', (req, res) => controlador.crear(req, res));
routerProvincias.put('/:id', (req, res) => controlador.actualizar(req, res));
routerProvincias.delete('/:id', (req, res) => controlador.eliminar(req, res));

export default routerProvincias;
