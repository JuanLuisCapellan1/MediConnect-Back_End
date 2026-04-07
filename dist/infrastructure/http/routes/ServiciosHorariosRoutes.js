"use strict";
/**
 * ServiciosHorariosRoutes.ts
 * Rutas HTTP para ServiciosHorarios
 * Acceso: Doctor y Administrador (requiere autenticación JWT)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const ServicioHorarioController_1 = require("../controllers/ServicioHorarioController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const router = (0, express_1.Router)();
const servicioHorarioController = tsyringe_1.container.resolve(ServicioHorarioController_1.ServicioHorarioController);
// Aplicar autenticación a todas las rutas de este router
router.use(autenticacion_1.autenticarJWT);
router.use((0, roleMiddleware_1.requireRole)('Doctor', 'Administrador'));
/**
 * @route POST /api/servicios-horarios
 * @desc Crear un nuevo ServicioHorario
 * @access Doctor, Administrador
 */
router.post('/', (req, res) => servicioHorarioController.crear(req, res));
/**
 * @route GET /api/servicios-horarios
 * @desc Listar todos los ServiciosHorarios con paginación
 * @access Doctor, Administrador
 */
router.get('/', (req, res) => servicioHorarioController.listar(req, res));
/**
 * @route GET /api/servicios-horarios/servicio/:servicioId
 * @desc Obtener todos los horarios de un servicio
 * @access Doctor, Administrador
 */
router.get('/servicio/:servicioId', (req, res) => servicioHorarioController.obtenerPorServicio(req, res));
/**
 * @route GET /api/servicios-horarios/horario/:horarioId
 * @desc Obtener todos los servicios de un horario
 * @access Doctor, Administrador
 */
router.get('/horario/:horarioId', (req, res) => servicioHorarioController.obtenerPorHorario(req, res));
/**
 * @route GET /api/servicios-horarios/estado/:estado
 * @desc Obtener todos los ServiciosHorarios filtrados por estado (Activo, Inactivo, Eliminado)
 * @access Doctor, Administrador
 */
router.get('/estado/:estado', (req, res) => servicioHorarioController.obtenerPorEstado(req, res));
/**
 * @route GET /api/servicios-horarios/:servicioId/:horarioId
 * @desc Obtener un ServicioHorario específico
 * @access Doctor, Administrador
 */
router.get('/:servicioId/:horarioId', (req, res) => servicioHorarioController.obtener(req, res));
/**
 * @route PUT /api/servicios-horarios/:servicioId/:horarioId
 * @desc Actualizar un ServicioHorario
 * @access Doctor, Administrador
 */
router.put('/:servicioId/:horarioId', (req, res) => servicioHorarioController.actualizar(req, res));
/**
 * @route DELETE /api/servicios-horarios/:servicioId/:horarioId
 * @desc Eliminar un ServicioHorario
 * @access Doctor, Administrador
 */
router.delete('/:servicioId/:horarioId', (req, res) => servicioHorarioController.eliminar(req, res));
exports.default = router;
