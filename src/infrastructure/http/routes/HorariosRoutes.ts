/**
 * HorariosRoutes.ts
 * Rutas HTTP para Horarios
 * Acceso: Doctor y Administrador (requiere autenticación JWT)
 */

import { Router } from 'express';
import { container } from 'tsyringe';
import { HorariosController } from '../controllers/HorariosController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();
const horariosController = container.resolve(HorariosController);

// Aplicar autenticación a todas las rutas de este router
router.use(autenticarJWT);
router.use(requireRole('Doctor', 'Administrador'));

/**
 * @route POST /horarios
 * @description Crea un nuevo horario
 * @access Doctor, Administrador
 */
router.post('/', (req, res) => horariosController.crear(req, res));

/**
 * @route GET /horarios
 * @description Lista todos los horarios
 * @access Doctor, Administrador
 */
router.get('/', (req, res) => horariosController.listarTodos(req, res));

/**
 * @route GET /horarios/doctor/:doctorId
 * @description Lista horarios por doctor
 * @access Doctor, Administrador
 */
router.get('/doctor/:doctorId', (req, res) => horariosController.listarPorDoctor(req, res));

/**
 * @route GET /horarios/dia/:diaSemana
 * @description Lista horarios por día de la semana
 * @access Doctor, Administrador
 */
router.get('/dia/:diaSemana', (req, res) => horariosController.listarPorDia(req, res));

/**
 * @route GET /horarios/estado/:estado
 * @description Lista horarios por estado
 * @access Doctor, Administrador
 */
router.get('/estado/:estado', (req, res) => horariosController.listarPorEstado(req, res));

/**
 * @route POST /horarios/verificar-conflictos
 * @description Verifica si hay conflictos entre los horarios indicados por ID
 * @access Doctor, Administrador
 */
router.post('/verificar-conflictos', (req, res) => horariosController.verificarConflictos(req, res));

/**
 * @route GET /horarios/:id
 * @description Busca un horario por ID
 * @access Doctor, Administrador
 */
router.get('/:id', (req, res) => horariosController.buscarPorId(req, res));

/**
 * @route PUT /horarios/:id
 * @description Actualiza un horario
 * @access Doctor, Administrador
 */
router.put('/:id', (req, res) => horariosController.actualizar(req, res));

/**
 * @route DELETE /horarios/:id
 * @description Elimina un horario (soft delete)
 * @access Doctor, Administrador
 */
router.delete('/:id', (req, res) => horariosController.eliminar(req, res));

export default router;