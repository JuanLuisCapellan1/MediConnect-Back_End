"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const tsyringe_1 = require("tsyringe");
const DoctorController_1 = require("../controllers/DoctorController");
const DoctorIdiomaController_1 = require("../controllers/DoctorIdiomaController");
const DoctorEspecialidadController_1 = require("../controllers/DoctorEspecialidadController");
const CentrosSaludController_1 = require("../controllers/CentrosSaludController");
const CitaController_1 = require("../controllers/CitaController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const TranslationMiddleware_1 = require("../middlewares/TranslationMiddleware");
// Configurar multer para archivos en memoria
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const router = (0, express_1.Router)();
const doctorController = new DoctorController_1.DoctorController();
const doctorIdiomaController = new DoctorIdiomaController_1.DoctorIdiomaController();
const doctorEspecialidadController = new DoctorEspecialidadController_1.DoctorEspecialidadController();
/**
 * GET /doctores
 * Listar doctores (Admin: todos; Paciente: solo activos y verificados)
 */
router.get('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador', 'Paciente', 'Centro'), TranslationMiddleware_1.translationMiddleware, (req, res) => doctorController.listar(req, res));
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
router.get('/mis-documentos', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), TranslationMiddleware_1.translationMiddleware, (req, res) => doctorController.obtenerEstadoDocumentos(req, res));
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
 * POST /doctores/idiomas
 * Agregar un idioma al doctor autenticado
 */
router.post('/idiomas', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => doctorIdiomaController.agregar(req, res));
/**
 * GET /doctores/idiomas
 * Obtener todos los idiomas del doctor autenticado
 */
router.get('/idiomas', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), TranslationMiddleware_1.translationMiddleware, (req, res) => doctorIdiomaController.obtenerIdiomas(req, res));
/**
 * PATCH /doctores/idiomas/:id
 * Actualizar un idioma del doctor autenticado
 */
router.patch('/idiomas/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => doctorIdiomaController.actualizar(req, res));
/**
 * DELETE /doctores/idiomas/:id
 * Eliminar un idioma del doctor autenticado
 */
router.delete('/idiomas/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => doctorIdiomaController.eliminar(req, res));
/**
 * POST /doctores/comparar
 * Comparar hasta 4 doctores (solo Paciente)
 * Body: { ids: number[] }
 */
router.post('/comparar', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => doctorController.compararDoctores(req, res));
/**
 * GET /doctores/especialidades
 * Listar especialidades del doctor autenticado
 */
router.get('/especialidades', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), TranslationMiddleware_1.translationMiddleware, (req, res) => doctorEspecialidadController.obtener(req, res));
/**
 * PUT /doctores/especialidades
 * Reemplazar configuración completa de especialidades
 */
router.put('/especialidades', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => doctorEspecialidadController.actualizar(req, res));
/**
 * PATCH /doctores/especialidades/:id_especialidad
 * Cambiar cuál especialidad es la principal
 */
router.patch('/especialidades/:id_especialidad', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => doctorEspecialidadController.cambiarPrincipal(req, res));
/**
 * DELETE /doctores/especialidades/:id_especialidad
 * Eliminar una especialidad secundaria
 */
router.delete('/especialidades/:id_especialidad', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => doctorEspecialidadController.eliminar(req, res));
/**
 * GET /doctores/pacientes-info/:pacienteId
 * Doctor obtiene toda la información de un paciente
 * Solo si el doctor ha tenido citas con ese paciente
 */
router.get('/pacientes-info/:pacienteId', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), TranslationMiddleware_1.translationMiddleware, (req, res) => doctorController.obtenerPaciente(req, res));
// ─── Solicitudes de alianza (lado Doctor) — ANTES de /:id para evitar captura ─
router.post('/solicitudes-alianza', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => tsyringe_1.container.resolve(CentrosSaludController_1.CentrosSaludController).doctorEnviarSolicitud(req, res));
router.get('/solicitudes-alianza', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), TranslationMiddleware_1.translationMiddleware, (req, res) => tsyringe_1.container.resolve(CentrosSaludController_1.CentrosSaludController).doctorListarSolicitudes(req, res));
router.put('/solicitudes-alianza/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => tsyringe_1.container.resolve(CentrosSaludController_1.CentrosSaludController).doctorResponderSolicitud(req, res));
/**
 * DELETE /doctores/solicitudes-alianza/:id
 * Doctor quita la conexión con un centro de salud (elimina la alianza).
 */
router.delete('/solicitudes-alianza/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => tsyringe_1.container.resolve(CentrosSaludController_1.CentrosSaludController).desconectarDoctor(req, res));
/**
 * GET /doctores/mis-centros
 * Doctor obtiene todos los centros de salud con los que tiene alianza aceptada.
 * Centro y Paciente pueden pasar ?doctorId para consultar los centros de un doctor específico.
 */
router.get('/mis-centros', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor', 'Centro', 'Paciente', 'Administrador'), TranslationMiddleware_1.translationMiddleware, (req, res) => tsyringe_1.container.resolve(CentrosSaludController_1.CentrosSaludController).doctorListarMisCentros(req, res));
// ─── Periodos de Inactividad del Doctor (antes de /:id) ─────────────
/**
 * POST /doctores/inactividad
 * Doctor registra un período de inactividad y cancela citas en ese rango
 */
router.post('/inactividad', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => tsyringe_1.container.resolve(CitaController_1.CitaController).registrarInactividad(req, res));
/**
 * GET /doctores/inactividad
 * Doctor lista sus periodos de inactividad
 */
router.get('/inactividad', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), TranslationMiddleware_1.translationMiddleware, (req, res) => tsyringe_1.container.resolve(CitaController_1.CitaController).listarInactividades(req, res));
/**
 * DELETE /doctores/inactividad/:periodoId
 * Doctor cancela un periodo de inactividad propio
 */
router.delete('/inactividad/:periodoId', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => tsyringe_1.container.resolve(CitaController_1.CitaController).cancelarInactividad(req, res));
// ─── Estadísticas del Doctor (antes de /:id) ──────────────────────────────────
/**
 * GET /doctores/estadisticas/pacientes
 * Estadísticas globales de pacientes del doctor autenticado.
 * Filtros opcionales: fechaDesde, fechaHasta, servicioId
 */
router.get('/estadisticas/pacientes', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), TranslationMiddleware_1.translationMiddleware, (req, res) => tsyringe_1.container.resolve(CitaController_1.CitaController).estadisticasPacientes(req, res));
/**
 * GET /doctores/estadisticas/citas
 * Estadísticas globales de citas del doctor autenticado.
 * Filtros opcionales: fechaDesde, fechaHasta, servicioId
 */
router.get('/estadisticas/citas', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), TranslationMiddleware_1.translationMiddleware, (req, res) => tsyringe_1.container.resolve(CitaController_1.CitaController).estadisticasCitas(req, res));
/**
 * GET /doctores/estadisticas/resumen
 * Resumen general: total pacientes, total consultas completadas, dinero ganado.
 */
router.get('/estadisticas/resumen', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), TranslationMiddleware_1.translationMiddleware, (req, res) => doctorController.resumenDoctor(req, res));
/**
 * GET /doctores/estadisticas/servicios
 * Estadísticas de servicios: activos, inactivos, total y promedio de rating.
 */
router.get('/estadisticas/servicios', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), TranslationMiddleware_1.translationMiddleware, (req, res) => doctorController.estadisticasServicios(req, res));
/**
 * GET /doctores/estadisticas/productividad
 * Análisis de consultas e ingresos agrupados por sub-período.
 * Query param: periodo = semana | mes | 3meses | año | todo
 */
router.get('/estadisticas/productividad', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), TranslationMiddleware_1.translationMiddleware, (req, res) => doctorController.productividadDoctor(req, res));
/**
 * GET /doctores/estadisticas/servicios-mas-utilizados
 * Servicios más utilizados (pie chart) y lista completa de servicios del doctor.
 */
router.get('/estadisticas/servicios-mas-utilizados', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), TranslationMiddleware_1.translationMiddleware, (req, res) => doctorController.serviciosMasUtilizados(req, res));
/**
 * GET /doctores/admin
 * Admin lista todos los doctores con filtros (nombre, apellido, estado, estadoVerificacion, etc.)
 */
router.get('/admin', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), TranslationMiddleware_1.translationMiddleware, (req, res) => doctorController.listarParaAdmin(req, res));
/**
 * GET /doctores/admin/:id
 * Admin obtiene perfil completo del doctor (documentos, verificación, ubicaciones, etc.)
 */
router.get('/admin/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), TranslationMiddleware_1.translationMiddleware, (req, res) => doctorController.obtenerParaAdmin(req, res));
/**
 * GET /doctores/:id
 * Obtener doctor por ID (cualquier usuario autenticado)
 */
router.get('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador', 'Paciente', 'Doctor', 'Centro'), TranslationMiddleware_1.translationMiddleware, (req, res) => doctorController.obtenerPorId(req, res));
/**
 * PATCH /doctores/:id
 * Actualizar doctor por ID (solo Administrador)
 */
router.patch('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => doctorController.actualizar(req, res));
/**
 * DELETE /doctores/:id
 * Eliminar doctor (solo Administrador)
 */
router.delete('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => doctorController.eliminar(req, res));
exports.default = router;
