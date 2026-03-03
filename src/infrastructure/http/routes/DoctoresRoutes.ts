import { Router } from 'express';
import multer from 'multer';
import { container } from 'tsyringe';
import { DoctorController } from '../controllers/DoctorController';
import { DoctorIdiomaController } from '../controllers/DoctorIdiomaController';
import { DoctorEspecialidadController } from '../controllers/DoctorEspecialidadController';
import { CentrosSaludController } from '../controllers/CentrosSaludController';
import { CitaController } from '../controllers/CitaController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';
import { translationMiddleware } from '../middlewares/TranslationMiddleware';

// Configurar multer para archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

const router = Router();
const doctorController = new DoctorController();
const doctorIdiomaController = new DoctorIdiomaController();
const doctorEspecialidadController = new DoctorEspecialidadController();

/**
 * GET /doctores
 * Listar doctores (Admin: todos; Paciente: solo activos y verificados)
 */
router.get(
    '/',
    autenticarJWT,
    requireRole('Admin', 'Paciente'),
    translationMiddleware,
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
    translationMiddleware,
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
 * POST /doctores/comparar
 * Comparar hasta 4 doctores (solo Paciente)
 * Body: { ids: number[] }
 */
router.post(
    '/comparar',
    autenticarJWT,
    requireRole('Paciente'),
    (req, res) => doctorController.compararDoctores(req, res)
);

/**
 * GET /doctores/especialidades
 * Listar especialidades del doctor autenticado
 */
router.get(
    '/especialidades',
    autenticarJWT,
    requireRole('Doctor'),
    translationMiddleware,
    (req, res) => doctorEspecialidadController.obtener(req, res)
);

/**
 * PUT /doctores/especialidades
 * Reemplazar configuración completa de especialidades
 */
router.put(
    '/especialidades',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => doctorEspecialidadController.actualizar(req, res)
);

/**
 * PATCH /doctores/especialidades/:id_especialidad
 * Cambiar cuál especialidad es la principal
 */
router.patch(
    '/especialidades/:id_especialidad',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => doctorEspecialidadController.cambiarPrincipal(req, res)
);

/**
 * DELETE /doctores/especialidades/:id_especialidad
 * Eliminar una especialidad secundaria
 */
router.delete(
    '/especialidades/:id_especialidad',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => doctorEspecialidadController.eliminar(req, res)
);

// ─── Solicitudes de alianza (lado Doctor) — ANTES de /:id para evitar captura ─
router.post(
    '/solicitudes-alianza',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => container.resolve(CentrosSaludController).doctorEnviarSolicitud(req, res)
);

router.get(
    '/solicitudes-alianza',
    autenticarJWT,
    requireRole('Doctor'),
    translationMiddleware,
    (req, res) => container.resolve(CentrosSaludController).doctorListarSolicitudes(req, res)
);

router.put(
    '/solicitudes-alianza/:id',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => container.resolve(CentrosSaludController).doctorResponderSolicitud(req, res)
);

// ─── Periodos de Inactividad del Doctor (antes de /:id) ─────────────
/**
 * POST /doctores/inactividad
 * Doctor registra un período de inactividad y cancela citas en ese rango
 */
router.post(
    '/inactividad',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => container.resolve(CitaController).registrarInactividad(req, res)
);

/**
 * GET /doctores/inactividad
 * Doctor lista sus periodos de inactividad
 */
router.get(
    '/inactividad',
    autenticarJWT,
    requireRole('Doctor'),
    translationMiddleware,
    (req, res) => container.resolve(CitaController).listarInactividades(req, res)
);

/**
 * DELETE /doctores/inactividad/:periodoId
 * Doctor cancela un periodo de inactividad propio
 */
router.delete(
    '/inactividad/:periodoId',
    autenticarJWT,
    requireRole('Doctor'),
    (req, res) => container.resolve(CitaController).cancelarInactividad(req, res)
);


/**
 * GET /doctores/:id
 * Obtener doctor por ID (Admin: datos completos; Paciente: perfil público sin documentos)
 */
router.get(
    '/:id',
    autenticarJWT,
    requireRole('Admin', 'Paciente'),
    translationMiddleware,
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
