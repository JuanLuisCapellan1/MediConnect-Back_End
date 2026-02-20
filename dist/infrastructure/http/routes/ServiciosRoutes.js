"use strict";
/**
 * ServiciosRoutes.ts
 * Rutas HTTP para Servicios médicos
 * Acceso:
 *   - Lecturas propias (mis-servicios): Doctor
 *   - Lecturas públicas (por doctor): Doctor, Administrador, Paciente
 *   - Mutaciones: Doctor
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const tsyringe_1 = require("tsyringe");
const ServiciosController_1 = require("../controllers/ServiciosController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const router = (0, express_1.Router)();
const serviciosController = tsyringe_1.container.resolve(ServiciosController_1.ServiciosController);
// Multer en memoria (máx 5MB por archivo, máx 10 archivos)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 10 },
    fileFilter: (_req, file, cb) => {
        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
        if (tiposPermitidos.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
        }
    }
});
// Aplicar autenticación a todas las rutas
router.use(autenticacion_1.autenticarJWT);
/**
 * @route POST /servicios
 * @description Crea un nuevo servicio. El doctor es el usuario autenticado (JWT).
 * @access Doctor
 */
router.post('/', (0, roleMiddleware_1.requireRole)('Doctor'), upload.array('imagenes', 10), (req, res) => serviciosController.crear(req, res));
/**
 * @route GET /servicios/mis-servicios
 * @description Lista los servicios del doctor autenticado con filtros opcionales
 * @access Doctor
 * IMPORTANTE: debe ir antes de /:id para que Express no lo interprete como un ID
 */
router.get('/mis-servicios', (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => serviciosController.listarMisServicios(req, res));
/**
 * @route GET /servicios/doctor/:doctorId
 * @description Lista los servicios de un doctor (para pacientes/admin)
 * @access Doctor, Administrador, Paciente
 */
router.get('/doctor/:doctorId', (0, roleMiddleware_1.requireRole)('Doctor', 'Administrador', 'Paciente'), (req, res) => serviciosController.listarPorDoctor(req, res));
/**
 * @route GET /servicios/centro/:centroId
 * @description Lista todos los servicios ofrecidos en un centro de salud
 * @access Doctor, Administrador, Paciente
 */
router.get('/centro/:centroId', (0, roleMiddleware_1.requireRole)('Doctor', 'Administrador', 'Paciente'), (req, res) => serviciosController.listarPorCentro(req, res));
/**
 * @route GET /servicios/:id
 * @description Obtiene el detalle completo de un servicio
 * @access Doctor, Administrador, Paciente
 */
router.get('/:id', (0, roleMiddleware_1.requireRole)('Doctor', 'Administrador', 'Paciente'), (req, res) => serviciosController.obtenerDetalle(req, res));
/**
 * @route PUT /servicios/:id
 * @description Actualiza los datos de un servicio (solo el doctor propietario)
 * @access Doctor
 */
router.put('/:id', (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => serviciosController.actualizar(req, res));
/**
 * @route DELETE /servicios/:id
 * @description Elimina un servicio (soft delete)
 * @access Doctor
 */
router.delete('/:id', (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => serviciosController.eliminar(req, res));
/**
 * @route PATCH /servicios/:id/desactivar
 * @description Desactiva un servicio (estado → Inactivo)
 * @access Doctor
 */
router.patch('/:id/desactivar', (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => serviciosController.desactivar(req, res));
/**
 * @route POST /servicios/:id/imagenes
 * @description Agrega imágenes a un servicio existente
 * @access Doctor
 */
router.post('/:id/imagenes', (0, roleMiddleware_1.requireRole)('Doctor'), upload.array('imagenes', 10), (req, res) => serviciosController.agregarImagenes(req, res));
/**
 * @route DELETE /servicios/:id/imagenes/:imagenId
 * @description Elimina una imagen de un servicio
 * @access Doctor
 */
router.delete('/:id/imagenes/:imagenId', (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => serviciosController.eliminarImagen(req, res));
exports.default = router;
