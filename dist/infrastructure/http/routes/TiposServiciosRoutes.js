"use strict";
/**
 * TiposServiciosRoutes.ts
 * Rutas HTTP para TiposServicios
 * Acceso: Doctor y Administrador (requiere autenticación JWT)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const TipoServicioController_1 = require("../controllers/TipoServicioController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const tiposServiciosRouter = (0, express_1.Router)();
const controller = tsyringe_1.container.resolve(TipoServicioController_1.TipoServicioController);
// Aplicar autenticación a todas las rutas de este router
tiposServiciosRouter.use(autenticacion_1.autenticarJWT);
tiposServiciosRouter.use((0, roleMiddleware_1.requireRole)('Doctor', 'Administrador'));
/**
 * @route GET /tipos-servicios
 * @description Lista todos los tipos de servicio con filtros y paginación
 * @access Doctor, Administrador
 */
tiposServiciosRouter.get('/', (req, res) => controller.listar(req, res));
/**
 * @route GET /tipos-servicios/:id
 * @description Obtiene un tipo de servicio por ID
 * @access Doctor, Administrador
 */
tiposServiciosRouter.get('/:id', (req, res) => controller.obtener(req, res));
/**
 * @route POST /tipos-servicios
 * @description Crea un nuevo tipo de servicio
 * @access Doctor, Administrador
 */
tiposServiciosRouter.post('/', (req, res) => controller.crear(req, res));
/**
 * @route PUT /tipos-servicios/:id
 * @description Actualiza un tipo de servicio
 * @access Doctor, Administrador
 */
tiposServiciosRouter.put('/:id', (req, res) => controller.actualizar(req, res));
/**
 * @route DELETE /tipos-servicios/:id
 * @description Elimina un tipo de servicio (soft delete)
 * @access Doctor, Administrador
 */
tiposServiciosRouter.delete('/:id', (req, res) => controller.eliminar(req, res));
exports.default = tiposServiciosRouter;
