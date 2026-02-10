"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const ServicioHorarioController_1 = require("../controllers/ServicioHorarioController");
const router = (0, express_1.Router)();
const servicioHorarioController = tsyringe_1.container.resolve(ServicioHorarioController_1.ServicioHorarioController);
/**
 * @route POST /api/servicios-horarios
 * @desc Crear un nuevo ServicioHorario
 */
router.post('/', (req, res) => servicioHorarioController.crear(req, res));
/**
 * @route GET /api/servicios-horarios
 * @desc Listar todos los ServiciosHorarios con paginación
 */
router.get('/', (req, res) => servicioHorarioController.listar(req, res));
/**
 * @route GET /api/servicios-horarios/servicio/:servicioId
 * @desc Obtener todos los horarios de un servicio
 */
router.get('/servicio/:servicioId', (req, res) => servicioHorarioController.obtenerPorServicio(req, res));
/**
 * @route GET /api/servicios-horarios/horario/:horarioId
 * @desc Obtener todos los servicios de un horario
 */
router.get('/horario/:horarioId', (req, res) => servicioHorarioController.obtenerPorHorario(req, res));
/**
 * @route GET /api/servicios-horarios/estado/:estado
 * @desc Obtener todos los ServiciosHorarios filtrados por estado (Activo, Inactivo, Eliminado)
 */
router.get('/estado/:estado', (req, res) => servicioHorarioController.obtenerPorEstado(req, res));
/**
 * @route GET /api/servicios-horarios/:servicioId/:horarioId
 * @desc Obtener un ServicioHorario específico
 */
router.get('/:servicioId/:horarioId', (req, res) => servicioHorarioController.obtener(req, res));
/**
 * @route PUT /api/servicios-horarios/:servicioId/:horarioId
 * @desc Actualizar un ServicioHorario
 */
router.put('/:servicioId/:horarioId', (req, res) => servicioHorarioController.actualizar(req, res));
/**
 * @route DELETE /api/servicios-horarios/:servicioId/:horarioId
 * @desc Eliminar un ServicioHorario
 */
router.delete('/:servicioId/:horarioId', (req, res) => servicioHorarioController.eliminar(req, res));
exports.default = router;
