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
// Admin - Gestión de tipos por aseguradora
// ============================================

/**
 * GET /api/seguros/:id/tipos
 * Lista los tipos de plan válidos de una aseguradora.
 */
routerSeguros.get(
    '/:id/tipos',
    autenticarJWT,
    (req, res) => controller.obtenerTiposDeSeguro(req, res)
);

/**
 * POST /api/seguros/:id/tipos
 * Asocia un tipo de plan a una aseguradora.
 * Body: { idTipoSeguro: number }
 */
routerSeguros.post(
    '/:id/tipos',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.agregarTipoASeguro(req, res)
);

/**
 * DELETE /api/seguros/:id/tipos/:tipoId
 * Desasocia un tipo de plan de una aseguradora.
 */
routerSeguros.delete(
    '/:id/tipos/:tipoId',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.eliminarTipoDeSeguro(req, res)
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

/**
 * GET /api/seguros/verificar-compatibilidad/:seguroId/:tipoSeguroId/doctor/:doctorId
 * Verifica compatibilidad de un seguro+plan entre el paciente autenticado y un doctor.
 * - doctorAcepta: el doctor tiene ese seguro+plan activo
 * - pacienteTiene: el paciente autenticado tiene ese seguro+plan activo
 * - compatible: ambos son true
 */
routerSeguros.get(
    '/verificar-compatibilidad/:seguroId/:tipoSeguroId/doctor/:doctorId',
    autenticarJWT,
    translationMiddleware,
    (req, res) => controller.verificarCompatibilidad(req, res)
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
