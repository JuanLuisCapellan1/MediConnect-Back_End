/**
 * UbicacionesRoutes.ts
 * Rutas HTTP para Ubicaciones
 */

import { Router } from 'express';
import { UbicacionesController } from '../controllers/UbicacionesController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';
import { translationMiddleware } from '../middlewares/TranslationMiddleware';

const router = Router();
const controller = new UbicacionesController();

// ─── Rutas autenticadas del doctor (ANTES de las rutas con :id) ───────────────

/**
 * GET /ubicaciones/mis-ubicaciones
 * Lista todas las ubicaciones del doctor autenticado (principal + horarios + servicios)
 */
router.get(
    '/mis-ubicaciones',
    autenticarJWT,
    requireRole('Doctor'),
    translationMiddleware,
    (req, res) => controller.listarMisUbicaciones(req, res)
);

/**
 * POST /ubicaciones/mis-ubicaciones
 * Crea una nueva ubicación y la asigna como ubicación principal del doctor autenticado
 */
router.post(
    '/mis-ubicaciones',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => controller.crearMiUbicacion(req, res)
);

// ─── Rutas públicas ───────────────────────────────────────────────────────────

/**
 * POST /ubicaciones
 * Crear una nueva ubicación
 */
router.post('/', (req, res) => controller.crear(req, res));

/**
 * GET /ubicaciones
 * Listar todas las ubicaciones
 */
router.get('/', translationMiddleware, (req, res) => controller.listarTodas(req, res));

/**
 * GET /ubicaciones/barrio/:barrioId
 * Listar ubicaciones por barrio
 */
router.get('/barrio/:barrioId', translationMiddleware, (req, res) => controller.listarPorBarrio(req, res));

/**
 * GET /ubicaciones/buscar/direccion/:direccion
 * Buscar ubicaciones por dirección
 */
router.get('/buscar/direccion/:direccion', translationMiddleware, (req, res) => controller.buscarPorDireccion(req, res));

/**
 * GET /ubicaciones/buscar/codigopostal/:codigoPostal
 * Buscar ubicaciones por código postal
 */
router.get('/buscar/codigopostal/:codigoPostal', translationMiddleware, (req, res) => controller.buscarPorCodigoPostal(req, res));

/**
 * GET /ubicaciones/buscar/estado/:estado
 * Buscar ubicaciones por estado
 */
router.get('/buscar/estado/:estado', translationMiddleware, (req, res) => controller.buscarPorEstado(req, res));

/**
 * GET /ubicaciones/:id
 * Buscar ubicación por ID
 */
router.get('/:id', translationMiddleware, (req, res) => controller.buscarPorId(req, res));

/**
 * PUT /ubicaciones/:id
 * Actualizar una ubicación
 */
router.put('/:id', (req, res) => controller.actualizar(req, res));

/**
 * DELETE /ubicaciones/:id
 * Eliminar una ubicación
 */
router.delete('/:id', (req, res) => controller.eliminar(req, res));

export default router;
