/**
 * TiposServiciosRoutes.ts
 * Rutas HTTP para TiposServicios
 * Acceso: Doctor y Administrador (requiere autenticación JWT)
 */

import { Router } from 'express';
import { container } from 'tsyringe';
import { TipoServicioController } from '../controllers/TipoServicioController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';

const tiposServiciosRouter = Router();
const controller = container.resolve(TipoServicioController);

// Aplicar autenticación a todas las rutas de este router
tiposServiciosRouter.use(autenticarJWT);
tiposServiciosRouter.use(requireRole('Doctor', 'Administrador'));

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

export default tiposServiciosRouter;
