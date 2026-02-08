import { Router } from 'express';
import { ConversacionesController } from '../controllers/ConversacionesController';
import { autenticarJWT } from '../middlewares/autenticacion';

const router = Router();
const controller = new ConversacionesController();

// Todas las rutas de conversaciones requieren autenticación
router.use(autenticarJWT);

/**
 * @route   GET /api/conversaciones
 * @desc    Obtiene todas las conversaciones del usuario autenticado
 * @access  Private
 */
router.get('/', (req, res) => controller.obtenerConversaciones(req, res));

/**
 * @route   POST /api/conversaciones
 * @desc    Crea una nueva conversación
 * @access  Private
 */
router.post('/', (req, res) => controller.crearConversacion(req, res));

/**
 * @route   POST /api/conversaciones/obtener-o-crear
 * @desc    Obtiene una conversación existente o crea una nueva
 * @access  Private
 */
router.post('/obtener-o-crear', (req, res) => controller.obtenerOCrearConversacion(req, res));

/**
 * @route   GET /api/conversaciones/:id
 * @desc    Obtiene una conversación específica
 * @access  Private
 */
router.get('/:id', (req, res) => controller.obtenerConversacion(req, res));

/**
 * @route   PATCH /api/conversaciones/:id
 * @desc    Actualiza una conversación (silenciar, archivar, etc.)
 * @access  Private
 */
router.patch('/:id', (req, res) => controller.actualizarConversacion(req, res));

/**
 * @route   DELETE /api/conversaciones/:id
 * @desc    Elimina una conversación
 * @access  Private
 */
router.delete('/:id', (req, res) => controller.eliminarConversacion(req, res));

export default router;
