import { Router } from 'express';
import { SeguroMedicoController } from '../controllers/SeguroMedicoController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';
import { translationMiddleware } from '../middlewares/TranslationMiddleware';

const routerSeguros = Router();
const controller = new SeguroMedicoController();

// ============================================
// Admin - CRUD completo
// ============================================

routerSeguros.post(
    '/',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.crear(req, res)
);

routerSeguros.get(
    '/',
    autenticarJWT,
    requireRole('Administrador'),
    translationMiddleware,
    (req, res) => controller.obtenerTodos(req, res)
);

routerSeguros.patch(
    '/:id',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.actualizar(req, res)
);

routerSeguros.delete(
    '/:id',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.eliminar(req, res)
);

// ============================================
// Público (autenticado) - Ver seguros disponibles
// ============================================

/**
 * GET /api/seguros/disponibles
 * Ver todos los seguros activos (pacientes, doctores, etc.)
 */
routerSeguros.get(
    '/disponibles',
    autenticarJWT,
    translationMiddleware,
    (req, res) => controller.obtenerSegurosDisponibles(req, res)
);

/**
 * GET /api/seguros/mas-utilizados
 * Ver el ranking de los seguros más utilizados por pacientes (cualquier usuario autenticado)
 */
routerSeguros.get(
    '/mas-utilizados',
    autenticarJWT,
    translationMiddleware,
    (req, res) => controller.masUtilizados(req, res)
);

// ============================================
// Público - Ver seguros aceptados de un doctor
// IMPORTANTE: antes de /mis-seguros y /seguros-aceptados para evitar conflictos
// ============================================

/**
 * GET /api/seguros/doctor/:doctorId/seguros-aceptados
 * Ver los seguros que acepta un doctor (cualquier usuario autenticado)
 */
routerSeguros.get(
    '/doctor/:doctorId/seguros-aceptados',
    autenticarJWT,
    translationMiddleware,
    (req, res) => controller.obtenerSegurosAceptadosPorDoctor(req, res)
);

// ============================================
// Paciente - Gestión de seguros (máximo 3)
// ============================================

routerSeguros.post(
    '/mis-seguros',
    autenticarJWT,
    requireRole('Paciente'),
    (req, res) => controller.agregarMiSeguro(req, res)
);

routerSeguros.get(
    '/mis-seguros',
    autenticarJWT,
    requireRole('Paciente'),
    translationMiddleware,
    (req, res) => controller.obtenerMisSeguros(req, res)
);

routerSeguros.delete(
    '/mis-seguros/:id',
    autenticarJWT,
    requireRole('Paciente'),
    (req, res) => controller.eliminarMiSeguro(req, res)
);

// ============================================
// Doctor - Gestión de seguros aceptados
// ============================================

routerSeguros.post(
    '/seguros-aceptados',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => controller.agregarSeguroAceptado(req, res)
);

routerSeguros.get(
    '/seguros-aceptados',
    autenticarJWT,
    requireRole('Doctor'),
    translationMiddleware,
    (req, res) => controller.obtenerSegurosAceptados(req, res)
);

routerSeguros.delete(
    '/seguros-aceptados/:seguroId/:tipoSeguroId',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => controller.eliminarSeguroAceptado(req, res)
);

export default routerSeguros;
