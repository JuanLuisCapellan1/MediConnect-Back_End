"use strict";
/**
 * SubBarriosRoutes.ts
 * Define las rutas HTTP para operaciones con SubBarrios
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const SubBarriosController_1 = require("../controllers/SubBarriosController");
const SubBarriosRoutes = (0, express_1.Router)();
const controller = tsyringe_1.container.resolve(SubBarriosController_1.SubBarriosController);
/**
 * POST /subBarrios
 * Crear un nuevo SubBarrio
 */
SubBarriosRoutes.post('/', (req, res) => controller.crear(req, res));
/**
 * GET /subBarrios
 * Listar todos los SubBarrios
 */
SubBarriosRoutes.get('/', (req, res) => controller.listar(req, res));
/**
 * GET /subBarrios/:id
 * Obtener un SubBarrio por ID
 */
SubBarriosRoutes.get('/:id', (req, res) => controller.obtenerPorId(req, res));
/**
 * PUT /subBarrios/:id
 * Actualizar un SubBarrio
 */
SubBarriosRoutes.put('/:id', (req, res) => controller.actualizar(req, res));
/**
 * DELETE /subBarrios/:id
 * Eliminar un SubBarrio
 */
SubBarriosRoutes.delete('/:id', (req, res) => controller.eliminar(req, res));
/**
 * GET /subBarrios/barrio/:barrioId
 * Listar SubBarrios de un barrio específico
 */
SubBarriosRoutes.get('/barrio/:barrioId', (req, res) => controller.listarPorBarrio(req, res));
/**
 * GET /subBarrios/nombre/:nombre/:estado
 * Buscar SubBarrios por nombre y estado
 */
SubBarriosRoutes.get('/nombre/:nombre/:estado', (req, res) => controller.buscarPorNombre(req, res));
/**
 * GET /subBarrios/estado/:estado
 * Buscar SubBarrios por estado
 */
SubBarriosRoutes.get('/estado/:estado', (req, res) => controller.buscarPorEstado(req, res));
exports.default = SubBarriosRoutes;
