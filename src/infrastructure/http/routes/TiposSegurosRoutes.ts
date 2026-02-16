import { Router } from 'express';
import { TipoSeguroController } from '../controllers/TipoSeguroController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';

const routerTiposSeguros = Router();
const controller = new TipoSeguroController();

// ============================================
// Admin - CRUD completo
// ============================================

/**
 * POST /api/tipos-seguros
 * Crear un nuevo tipo de seguro (Solo Admin)
 */
routerTiposSeguros.post(
    '/',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.crear(req, res)
);

/**
 * GET /api/tipos-seguros
 * Obtener todos los tipos de seguros con filtros (Solo Admin)
 */
routerTiposSeguros.get(
    '/',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.obtenerTodos(req, res)
);

/**
 * GET /api/tipos-seguros/:id
 * Obtener un tipo de seguro por ID (Solo Admin)
 */
routerTiposSeguros.get(
    '/:id',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.obtenerPorId(req, res)
);

/**
 * PATCH /api/tipos-seguros/:id
 * Actualizar un tipo de seguro (Solo Admin)
 */
routerTiposSeguros.patch(
    '/:id',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.actualizar(req, res)
);

/**
 * DELETE /api/tipos-seguros/:id
 * Eliminar (soft delete) un tipo de seguro (Solo Admin)
 */
routerTiposSeguros.delete(
    '/:id',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.eliminar(req, res)
);

// ============================================
// Público - Solo lectura de tipos activos
// ============================================

/**
 * GET /api/tipos-seguros/disponibles
 * Obtener tipos de seguros activos (Público/Autenticado)
 */
routerTiposSeguros.get(
    '/disponibles',
    (req, res) => controller.obtenerActivos(req, res)
);

export default routerTiposSeguros;
