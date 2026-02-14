import { Router } from 'express';
import { SeguroMedicoController } from '../controllers/SeguroMedicoController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';

const routerSeguros = Router();
const controller = new SeguroMedicoController();

// ============================================
// Admin - CRUD completo
// ============================================

/**
 * POST /api/seguros
 * Crear un nuevo seguro médico (Solo Admin)
 */
routerSeguros.post(
    '/',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.crear(req, res)
);

/**
 * GET /api/seguros
 * Obtener todos los seguros (Solo Admin)
 */
routerSeguros.get(
    '/',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.obtenerTodos(req, res)
);

/**
 * PATCH /api/seguros/:id
 * Actualizar un seguro médico (Solo Admin)
 */
routerSeguros.patch(
    '/:id',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.actualizar(req, res)
);

/**
 * DELETE /api/seguros/:id
 * Eliminar (desactivar) un seguro médico (Solo Admin)
 */
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
 * Ver todos los seguros disponibles (Pacientes y Doctores)
 */
routerSeguros.get(
    '/disponibles',
    autenticarJWT,
    (req, res) => controller.obtenerSegurosDisponibles(req, res)
);

// ============================================
// Paciente - Gestión de seguros (máximo 3)
// ============================================

/**
 * POST /api/seguros/mis-seguros
 * Agregar un seguro al perfil del paciente (máximo 3)
 */
routerSeguros.post(
    '/mis-seguros',
    autenticarJWT,
    requireRole('Paciente'),
    (req, res) => controller.agregarMiSeguro(req, res)
);

/**
 * GET /api/seguros/mis-seguros
 * Obtener los seguros del paciente
 */
routerSeguros.get(
    '/mis-seguros',
    autenticarJWT,
    requireRole('Paciente'),
    (req, res) => controller.obtenerMisSeguros(req, res)
);

/**
 * DELETE /api/seguros/mis-seguros/:id
 * Eliminar un seguro del perfil del paciente
 */
routerSeguros.delete(
    '/mis-seguros/:id',
    autenticarJWT,
    requireRole('Paciente'),
    (req, res) => controller.eliminarMiSeguro(req, res)
);

// ============================================
// Doctor - Gestión de seguros aceptados (ilimitado)
// ============================================

/**
 * POST /api/seguros/seguros-aceptados
 * Agregar un seguro a los seguros aceptados del doctor
 */
routerSeguros.post(
    '/seguros-aceptados',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => controller.agregarSeguroAceptado(req, res)
);

/**
 * GET /api/seguros/seguros-aceptados
 * Obtener los seguros aceptados del doctor
 */
routerSeguros.get(
    '/seguros-aceptados',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => controller.obtenerSegurosAceptados(req, res)
);

/**
 * DELETE /api/seguros/seguros-aceptados/:seguroId/:tipoSeguroId
 * Eliminar un seguro de los seguros aceptados del doctor
 */
routerSeguros.delete(
    '/seguros-aceptados/:seguroId/:tipoSeguroId',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => controller.eliminarSeguroAceptado(req, res)
);

export default routerSeguros;
