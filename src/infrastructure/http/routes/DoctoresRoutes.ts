import { Router } from 'express';
import multer from 'multer';
import { DoctorController } from '../controllers/DoctorController';
import { DoctorIdiomaController } from '../controllers/DoctorIdiomaController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';
import { translationMiddleware } from '../middlewares/TranslationMiddleware';

// Configurar multer para archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

const router = Router();
const doctorController = new DoctorController();
const doctorIdiomaController = new DoctorIdiomaController();

/**
 * GET /doctores
 * Listar doctores (solo Admin)
 */
router.get(
    '/',
    autenticarJWT,
    requireRole('Admin'),
    (req, res) => doctorController.listar(req, res)
);

/**
 * GET /doctores/me
 * Obtener perfil del doctor autenticado con toda su información
 */
router.get(
    '/me',
    autenticarJWT,
    requireRole('Doctor'),
    translationMiddleware,
    (req, res) => doctorController.obtenerPerfil(req, res)
);

/**
 * PATCH /doctores/me
 * Actualizar perfil del doctor autenticado
 */
router.patch(
    '/me',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => doctorController.actualizarPerfil(req, res)
);

/**
 * GET /doctores/mis-documentos
 * Obtener estado de documentos del doctor autenticado
 */
router.get(
    '/mis-documentos',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => doctorController.obtenerEstadoDocumentos(req, res)
);

/**
 * PUT /doctores/documentos/:id
 * Actualizar un documento rechazado
 * Requiere: multipart/form-data con campo 'archivo'
 */
router.put(
    '/documentos/:id',
    autenticarJWT,
    requireRole('Doctor'),
    upload.single('archivo'),
    (req, res) => doctorController.actualizarDocumento(req, res)
);

/**
 * POST /doctores/certificaciones
 * Agregar una nueva certificación
 * Requiere: multipart/form-data con campo 'archivo' y 'descripcion'
 */
router.post(
    '/certificaciones',
    autenticarJWT,
    requireRole('Doctor'),
    upload.single('archivo'),
    (req, res) => doctorController.agregarCertificacion(req, res)
);

/**
 * POST /doctores/idiomas
 * Agregar un idioma al doctor autenticado
 */
router.post(
    '/idiomas',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => doctorIdiomaController.agregar(req, res)
);

/**
 * GET /doctores/idiomas
 * Obtener todos los idiomas del doctor autenticado
 */
router.get(
    '/idiomas',
    autenticarJWT,
    requireRole('Doctor'),
    translationMiddleware,
    (req, res) => doctorIdiomaController.obtenerIdiomas(req, res)
);

/**
 * PATCH /doctores/idiomas/:id
 * Actualizar un idioma del doctor autenticado
 */
router.patch(
    '/idiomas/:id',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => doctorIdiomaController.actualizar(req, res)
);

/**
 * DELETE /doctores/idiomas/:id
 * Eliminar un idioma del doctor autenticado
 */
router.delete(
    '/idiomas/:id',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => doctorIdiomaController.eliminar(req, res)
);

/**
 * GET /doctores/:id
 * Obtener doctor por ID (solo Admin)
 */
router.get(
    '/:id',
    autenticarJWT,
    requireRole('Admin'),
    (req, res) => doctorController.obtenerPorId(req, res)
);

/**
 * PATCH /doctores/:id
 * Actualizar doctor por ID (solo Admin)
 */
router.patch(
    '/:id',
    autenticarJWT,
    requireRole('Admin'),
    (req, res) => doctorController.actualizar(req, res)
);

/**
 * DELETE /doctores/:id
 * Eliminar doctor (solo Admin)
 */
router.delete(
    '/:id',
    autenticarJWT,
    requireRole('Admin'),
    (req, res) => doctorController.eliminar(req, res)
);

export default router;
