"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const DoctorController_1 = require("../controllers/DoctorController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const TranslationMiddleware_1 = require("../middlewares/TranslationMiddleware");
// Configurar multer para archivos en memoria
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const router = (0, express_1.Router)();
const doctorController = new DoctorController_1.DoctorController();
/**
 * GET /doctores
 * Listar doctores (solo Admin)
 */
router.get('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Admin'), (req, res) => doctorController.listar(req, res));
/**
 * GET /doctores/me
 * Obtener perfil del doctor autenticado con toda su información
 */
router.get('/me', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), TranslationMiddleware_1.translationMiddleware, (req, res) => doctorController.obtenerPerfil(req, res));
/**
 * PATCH /doctores/me
 * Actualizar perfil del doctor autenticado
 */
router.patch('/me', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => doctorController.actualizarPerfil(req, res));
/**
 * GET /doctores/mis-documentos
 * Obtener estado de documentos del doctor autenticado
 */
router.get('/mis-documentos', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => doctorController.obtenerEstadoDocumentos(req, res));
/**
 * PUT /doctores/documentos/:id
 * Actualizar un documento rechazado
 * Requiere: multipart/form-data con campo 'archivo'
 */
router.put('/documentos/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), upload.single('archivo'), (req, res) => doctorController.actualizarDocumento(req, res));
/**
 * POST /doctores/certificaciones
 * Agregar una nueva certificación
 * Requiere: multipart/form-data con campo 'archivo' y 'descripcion'
 */
router.post('/certificaciones', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), upload.single('archivo'), (req, res) => doctorController.agregarCertificacion(req, res));
/**
 * GET /doctores/:id
 * Obtener doctor por ID (solo Admin)
 */
router.get('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Admin'), (req, res) => doctorController.obtenerPorId(req, res));
/**
 * PATCH /doctores/:id
 * Actualizar doctor por ID (solo Admin)
 */
router.patch('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Admin'), (req, res) => doctorController.actualizar(req, res));
/**
 * DELETE /doctores/:id
 * Eliminar doctor (solo Admin)
 */
router.delete('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Admin'), (req, res) => doctorController.eliminar(req, res));
exports.default = router;
