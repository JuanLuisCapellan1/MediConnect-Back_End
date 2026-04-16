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
const CitaController_1 = require("../controllers/CitaController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const TranslationMiddleware_1 = require("../middlewares/TranslationMiddleware");
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
 * @route GET /servicios/cercanos
 * @description Busca servicios activos dentro de un radio geográfico (0-15 km)
 * @access Doctor, Administrador, Paciente
 * IMPORTANTE: debe ir antes de /:id
 */
router.get('/cercanos', (0, roleMiddleware_1.requireRole)('Doctor', 'Administrador', 'Paciente'), TranslationMiddleware_1.translationMiddleware, (req, res) => serviciosController.buscarCercanos(req, res));
/**
 * @route GET /servicios/mis-servicios
 * @description Lista los servicios del doctor autenticado con filtros opcionales
 * @access Doctor
 * IMPORTANTE: debe ir antes de /:id para que Express no lo interprete como un ID
 */
router.get('/mis-servicios', (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => serviciosController.listarMisServicios(req, res));
/**
 * @route GET /servicios/doctor/:doctorId
 * @description Lista los servicios de un doctor (para pacientes/admin/centro)
 * @access Doctor, Administrador, Paciente, Centro
 */
router.get('/doctor/:doctorId', (0, roleMiddleware_1.requireRole)('Doctor', 'Administrador', 'Paciente', 'Centro'), (req, res) => serviciosController.listarPorDoctor(req, res));
/**
 * @route GET /servicios/centro/:centroId
 * @description Lista todos los servicios ofrecidos en un centro de salud
 * @access Doctor, Administrador, Paciente
 */
router.get('/centro/:centroId', (0, roleMiddleware_1.requireRole)('Doctor', 'Administrador', 'Paciente'), (req, res) => serviciosController.listarPorCentro(req, res));
/**
 * @route GET /servicios/doctor/:doctorId/disponibilidad
 * @description Resumen de disponibilidad por día para todos los servicios del doctor
 * @access Paciente, Doctor, Administrador
 * IMPORTANTE: debe ir antes de /:id
 */
router.get('/doctor/:doctorId/disponibilidad', (0, roleMiddleware_1.requireRole)('Paciente', 'Doctor', 'Administrador'), TranslationMiddleware_1.translationMiddleware, (req, res) => tsyringe_1.container.resolve(CitaController_1.CitaController).disponibilidadDoctor(req, res));
/**
 * @route GET /servicios/:id/slots-disponibles
 * @description Retorna solo los slots disponibles de un servicio en una fecha (sin los ocupados)
 * @access Paciente, Doctor, Administrador
 * IMPORTANTE: debe ir antes de /:id
 */
router.get('/:id/slots-disponibles', (0, roleMiddleware_1.requireRole)('Paciente', 'Doctor', 'Administrador'), TranslationMiddleware_1.translationMiddleware, (req, res) => tsyringe_1.container.resolve(CitaController_1.CitaController).slotsDisponiblesParaServicio(req, res));
/**
 * @route GET /servicios/:id/slots
 * @description Consulta los slots de disponibilidad de un servicio en una fecha (YYYY-MM-DD)
 * @access Paciente, Doctor, Administrador
 * IMPORTANTE: debe ir antes de /:id
 */
router.get('/:id/slots', (0, roleMiddleware_1.requireRole)('Paciente', 'Doctor', 'Administrador'), (req, res) => tsyringe_1.container.resolve(CitaController_1.CitaController).slotsDisponibles(req, res));
/**
 * @route GET /servicios/:id
 * @description Obtiene el detalle completo de un servicio
 * @access Doctor, Administrador, Paciente, Centro
 */
router.get('/:id', (0, roleMiddleware_1.requireRole)('Doctor', 'Administrador', 'Paciente', 'Centro'), (req, res) => serviciosController.obtenerDetalle(req, res));
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
