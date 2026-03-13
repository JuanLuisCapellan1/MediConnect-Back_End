"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BarriosController_1 = require("../controllers/BarriosController");
const TranslationMiddleware_1 = require("../middlewares/TranslationMiddleware");
const routerBarrios = (0, express_1.Router)();
const controlador = new BarriosController_1.BarriosController();
// Rutas geoespaciales (deben ir ANTES de /:id para evitar colisiones de Express)
routerBarrios.get('/geo/punto', (req, res) => controlador.buscarPorCoordenadas(req, res));
routerBarrios.get('/geo/:id', (req, res) => controlador.obtenerGeometria(req, res));
routerBarrios.get('/', TranslationMiddleware_1.translationMiddleware, (req, res) => controlador.listarTodos(req, res));
routerBarrios.get('/estado/:estado', TranslationMiddleware_1.translationMiddleware, (req, res) => controlador.buscarPorEstado(req, res));
routerBarrios.get('/seccion/:seccionId', TranslationMiddleware_1.translationMiddleware, (req, res) => controlador.buscarPorSeccion(req, res));
routerBarrios.get('/nombre/:nombre/:seccionId/:estado', TranslationMiddleware_1.translationMiddleware, (req, res) => controlador.buscarPorNombre(req, res));
routerBarrios.get('/:id', TranslationMiddleware_1.translationMiddleware, (req, res) => controlador.buscarPorId(req, res));
routerBarrios.post('/', (req, res) => controlador.crear(req, res));
routerBarrios.put('/:id', (req, res) => controlador.actualizar(req, res));
routerBarrios.delete('/:id', (req, res) => controlador.eliminar(req, res));
exports.default = routerBarrios;
