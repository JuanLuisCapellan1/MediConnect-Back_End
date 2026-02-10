"use strict";
/**
 * HorariosRoutes.ts
 * Rutas HTTP para Horarios
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const HorariosController_1 = require("../controllers/HorariosController");
const router = (0, express_1.Router)();
const horariosController = tsyringe_1.container.resolve(HorariosController_1.HorariosController);
/**
 * @route POST /horarios
 * @description Crea un nuevo horario
 */
router.post('/', (req, res) => horariosController.crear(req, res));
/**
 * @route GET /horarios
 * @description Lista todos los horarios
 */
router.get('/', (req, res) => horariosController.listarTodos(req, res));
/**
 * @route GET /horarios/doctor/:doctorId
 * @description Lista horarios por doctor
 */
router.get('/doctor/:doctorId', (req, res) => horariosController.listarPorDoctor(req, res));
/**
 * @route GET /horarios/dia/:diaSemana
 * @description Lista horarios por día de la semana
 */
router.get('/dia/:diaSemana', (req, res) => horariosController.listarPorDia(req, res));
/**
 * @route GET /horarios/estado/:estado
 * @description Lista horarios por estado
 */
router.get('/estado/:estado', (req, res) => horariosController.listarPorEstado(req, res));
/**
 * @route GET /horarios/:id
 * @description Busca un horario por ID
 */
router.get('/:id', (req, res) => horariosController.buscarPorId(req, res));
/**
 * @route PUT /horarios/:id
 * @description Actualiza un horario
 */
router.put('/:id', (req, res) => horariosController.actualizar(req, res));
/**
 * @route DELETE /horarios/:id
 * @description Elimina un horario (soft delete)
 */
router.delete('/:id', (req, res) => horariosController.eliminar(req, res));
exports.default = router;
