"use strict";
/**
 * UbicacionesRoutes.ts
 * Rutas HTTP para Ubicaciones
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const UbicacionesController_1 = require("../controllers/UbicacionesController");
const router = (0, express_1.Router)();
const ubicacionesController = tsyringe_1.container.resolve(UbicacionesController_1.UbicacionesController);
/**
 * @route POST /ubicaciones
 * @description Crea una nueva Ubicacion
 * @body {barrioId: number, direccion: string, subBarrioId?: number, codigoPostal?: string}
 * @returns {Ubicacion} La ubicación creada
 */
router.post('/', (req, res) => ubicacionesController.crear(req, res));
/**
 * @route GET /ubicaciones
 * @description Lista todas las Ubicaciones
 * @returns {Ubicacion[]} Array de ubicaciones
 */
router.get('/', (req, res) => ubicacionesController.listarTodas(req, res));
/**
 * @route GET /ubicaciones/barrio/:barrioId
 * @description Lista Ubicaciones de un barrio específico
 * @param {number} barrioId - ID del barrio
 * @returns {Ubicacion[]} Array de ubicaciones del barrio
 */
router.get('/barrio/:barrioId', (req, res) => ubicacionesController.listarPorBarrio(req, res));
/**
 * @route GET /ubicaciones/subbarrio/:subBarrioId
 * @description Lista Ubicaciones de un SubBarrio específico
 * @param {number} subBarrioId - ID del subbarrio
 * @returns {Ubicacion[]} Array de ubicaciones del subbarrio
 */
router.get('/subbarrio/:subBarrioId', (req, res) => ubicacionesController.listarPorSubBarrio(req, res));
/**
 * @route GET /ubicaciones/buscar/direccion/:direccion
 * @description Busca Ubicaciones por dirección (búsqueda parcial, case-insensitive)
 * @param {string} direccion - Parte de la dirección a buscar
 * @returns {Ubicacion[]} Array de ubicaciones que coinciden
 */
router.get('/buscar/direccion/:direccion', (req, res) => ubicacionesController.buscarPorDireccion(req, res));
/**
 * @route GET /ubicaciones/buscar/codigopostal/:codigoPostal
 * @description Busca Ubicaciones por código postal
 * @param {string} codigoPostal - Código postal
 * @returns {Ubicacion[]} Array de ubicaciones que coinciden
 */
router.get('/buscar/codigopostal/:codigoPostal', (req, res) => ubicacionesController.buscarPorCodigoPostal(req, res));
/**
 * @route GET /ubicaciones/buscar/estado/:estado
 * @description Busca Ubicaciones por estado
 * @param {string} estado - Estado a buscar (Activo, Eliminado, etc.)
 * @returns {Ubicacion[]} Array de ubicaciones que coinciden
 */
router.get('/buscar/estado/:estado', (req, res) => ubicacionesController.buscarPorEstado(req, res));
/**
 * @route GET /ubicaciones/:id
 * @description Busca una Ubicacion por ID
 * @param {number} id - ID de la ubicación
 * @returns {Ubicacion|null} La ubicación encontrada o null
 */
router.get('/:id', (req, res) => ubicacionesController.buscarPorId(req, res));
/**
 * @route PUT /ubicaciones/:id
 * @description Actualiza una Ubicacion existente
 * @param {number} id - ID de la ubicación
 * @body {barrioId?: number, subBarrioId?: number, direccion?: string, codigoPostal?: string, estado?: string}
 * @returns {Ubicacion} La ubicación actualizada
 */
router.put('/:id', (req, res) => ubicacionesController.actualizar(req, res));
/**
 * @route DELETE /ubicaciones/:id
 * @description Elimina una Ubicacion (eliminación lógica)
 * @param {number} id - ID de la ubicación
 * @returns {Ubicacion} La ubicación eliminada
 */
router.delete('/:id', (req, res) => ubicacionesController.eliminar(req, res));
exports.default = router;
