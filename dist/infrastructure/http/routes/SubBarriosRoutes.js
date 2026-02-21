"use strict";
/**
 * SubBarriosRoutes.ts
 * Define las rutas HTTP para operaciones con SubBarrios
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const SubBarriosController_1 = require("../controllers/SubBarriosController");
const TranslationMiddleware_1 = require("../middlewares/TranslationMiddleware");
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
SubBarriosRoutes.get('/', TranslationMiddleware_1.translationMiddleware, (req, res) => controller.listar(req, res));
/**
 * GET /subBarrios/barrio/:barrioId
 * Listar SubBarrios de un barrio específico (debe ir ANTES de /:id)
 */
SubBarriosRoutes.get('/barrio/:barrioId', TranslationMiddleware_1.translationMiddleware, (req, res) => controller.listarPorBarrio(req, res));
/**
 * GET /subBarrios/nombre/:nombre/:estado
 * Buscar SubBarrios por nombre y estado
 */
SubBarriosRoutes.get('/nombre/:nombre/:estado', TranslationMiddleware_1.translationMiddleware, (req, res) => controller.buscarPorNombre(req, res));
/**
 * GET /subBarrios/estado/:estado
 * Buscar SubBarrios por estado
 */
SubBarriosRoutes.get('/estado/:estado', TranslationMiddleware_1.translationMiddleware, (req, res) => controller.buscarPorEstado(req, res));
/**
 * GET /subBarrios/:id
 * Obtener un SubBarrio por ID
 */
SubBarriosRoutes.get('/:id', TranslationMiddleware_1.translationMiddleware, (req, res) => controller.obtenerPorId(req, res));
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
exports.default = SubBarriosRoutes;
