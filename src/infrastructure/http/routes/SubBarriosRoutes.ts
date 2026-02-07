/**
 * SubBarriosRoutes.ts
 * Define las rutas HTTP para operaciones con SubBarrios
 */

import { Router } from 'express';
import { container } from 'tsyringe';
import { SubBarriosController } from '../controllers/SubBarriosController';

const SubBarriosRoutes = Router();
const controller = container.resolve(SubBarriosController);

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
SubBarriosRoutes.get('/barrio/:barrioId', (req, res) =>
  controller.listarPorBarrio(req, res)
);

/**
 * GET /subBarrios/nombre/:nombre/:estado
 * Buscar SubBarrios por nombre y estado
 */
SubBarriosRoutes.get('/nombre/:nombre/:estado', (req, res) =>
  controller.buscarPorNombre(req, res)
);

/**
 * GET /subBarrios/estado/:estado
 * Buscar SubBarrios por estado
 */
SubBarriosRoutes.get('/estado/:estado', (req, res) =>
  controller.buscarPorEstado(req, res)
);

export default SubBarriosRoutes;
