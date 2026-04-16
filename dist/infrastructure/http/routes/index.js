"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TraduccionController_1 = require("../controllers/TraduccionController");
const TranslationUtilsController_1 = require("../controllers/TranslationUtilsController");
const ProvinciasRoutes_1 = __importDefault(require("./ProvinciasRoutes"));
const MunicipiosRoutes_1 = __importDefault(require("./MunicipiosRoutes"));
const DistritosMunicipalesRoutes_1 = __importDefault(require("./DistritosMunicipalesRoutes"));
const SeccionesRoutes_1 = __importDefault(require("./SeccionesRoutes"));
const BarriosRoutes_1 = __importDefault(require("./BarriosRoutes"));
const UbicacionesRoutes_1 = __importDefault(require("./UbicacionesRoutes"));
const HorariosRoutes_1 = __importDefault(require("./HorariosRoutes"));
const ServiciosHorariosRoutes_1 = __importDefault(require("./ServiciosHorariosRoutes"));
const EspecialidadesRoutes_1 = __importDefault(require("./EspecialidadesRoutes"));
const PacientesRoutes_1 = __importDefault(require("./PacientesRoutes"));
const DoctoresRoutes_1 = __importDefault(require("./DoctoresRoutes"));
const AccionesRoutes_1 = __importDefault(require("./AccionesRoutes"));
const TiposCentrosSaludRoutes_1 = __importDefault(require("./TiposCentrosSaludRoutes"));
const CentrosSaludRoutes_1 = __importDefault(require("./CentrosSaludRoutes"));
const ExperienciasLaboralesRoutes_1 = __importDefault(require("./ExperienciasLaboralesRoutes"));
const FormacionesAcademicasRoutes_1 = __importDefault(require("./FormacionesAcademicasRoutes"));
const PaisesRoutes_1 = __importDefault(require("./PaisesRoutes"));
const UniversidadesRoutes_1 = __importDefault(require("./UniversidadesRoutes"));
const AuthRoutes_1 = __importDefault(require("./AuthRoutes"));
const AuthPasswordRoutes_1 = __importDefault(require("./AuthPasswordRoutes"));
const notificaciones_routes_1 = __importDefault(require("./notificaciones.routes"));
const conversaciones_routes_1 = __importDefault(require("./conversaciones.routes"));
const mensajes_routes_1 = __importStar(require("./mensajes.routes"));
const CondicionesMedicasRoutes_1 = __importDefault(require("./CondicionesMedicasRoutes"));
const SegurosRoutes_1 = __importDefault(require("./SegurosRoutes"));
const TiposSegurosRoutes_1 = __importDefault(require("./TiposSegurosRoutes"));
const ServiciosRoutes_1 = __importDefault(require("./ServiciosRoutes"));
const TranslationMiddleware_1 = require("../middlewares/TranslationMiddleware");
const TranslationRateLimiter_1 = require("../middlewares/TranslationRateLimiter");
const DoctorIdiomasRoutes_1 = __importDefault(require("./DoctorIdiomasRoutes"));
const CitasRoutes_1 = __importDefault(require("./CitasRoutes"));
const TeleconsultasRoutes_1 = __importDefault(require("./TeleconsultasRoutes"));
const ResenasRoutes_1 = __importDefault(require("./ResenasRoutes"));
const MediaRoutes_1 = __importDefault(require("./MediaRoutes"));
const FavoritosRoutes_1 = __importDefault(require("./FavoritosRoutes"));
const BusquedaRoutes_1 = __importDefault(require("./BusquedaRoutes"));
const EstadisticasAdminRoutes_1 = __importDefault(require("./EstadisticasAdminRoutes"));
const ContactoRoutes_1 = __importDefault(require("./ContactoRoutes"));
const router = (0, express_1.Router)();
const traduccionController = new TraduccionController_1.TraduccionController();
const translationUtilsController = new TranslationUtilsController_1.TranslationUtilsController();
// Aplicar rate limiting para traducciones (debe ir primero)
router.use(TranslationRateLimiter_1.translationRateLimitMiddleware);
// Aplicar el middleware de traducción a todas las rutas
router.use(TranslationMiddleware_1.translationMiddleware);
// Rutas de traducción y utilidades
router.post('/traduccion', (req, res) => traduccionController.traslate(req, res));
router.get('/translation/languages', (req, res) => translationUtilsController.getLanguages(req, res));
router.get('/translation/cache/stats', (req, res) => translationUtilsController.getCacheStats(req, res));
router.delete('/translation/cache', (req, res) => translationUtilsController.clearCache(req, res));
router.get('/translation/rate-limit/stats', (req, res) => translationUtilsController.getRateLimitStats(req, res));
router.post('/translation/rate-limit/reset', (req, res) => translationUtilsController.resetRateLimit(req, res));
router.get('/translation/validate/:code', (req, res) => translationUtilsController.validateLanguage(req, res));
router.get('/translation/health', (req, res) => translationUtilsController.healthCheck(req, res));
// Rutas de autenticación
router.use('/auth', AuthRoutes_1.default);
router.use('/auth', AuthPasswordRoutes_1.default);
// Rutas de geografía
router.use('/provincias', ProvinciasRoutes_1.default);
router.use('/municipios', MunicipiosRoutes_1.default);
router.use('/distritos', DistritosMunicipalesRoutes_1.default);
router.use('/secciones', SeccionesRoutes_1.default);
router.use('/barrios', BarriosRoutes_1.default);
router.use('/ubicaciones', UbicacionesRoutes_1.default);
router.use('/paises', PaisesRoutes_1.default);
router.use('/universidades', UniversidadesRoutes_1.default);
// Rutas de horarios
router.use('/horarios', HorariosRoutes_1.default);
// Rutas de Servicios Horarios
router.use('/servicios-horarios', ServiciosHorariosRoutes_1.default);
// Rutas de Especialidades
router.use('/especialidades', EspecialidadesRoutes_1.default);
// Rutas de Pacientes
router.use('/pacientes', PacientesRoutes_1.default);
// Rutas de Doctores
router.use('/doctores', DoctoresRoutes_1.default);
// Rutas de Acciones (Revisión de Documentos)
router.use('/acciones', AccionesRoutes_1.default);
// Rutas de Tipos de Centros de Salud
router.use('/tipos-centros-salud', TiposCentrosSaludRoutes_1.default);
// Rutas de Centros de Salud
router.use('/centros-salud', CentrosSaludRoutes_1.default);
// Rutas de Experiencias Laborales
router.use('/experiencias-laborales', ExperienciasLaboralesRoutes_1.default);
// Rutas de Formaciones Académicas
router.use('/formaciones-academicas', FormacionesAcademicasRoutes_1.default);
// Rutas de Doctor Idiomas
router.use('/doctores/idiomas', DoctorIdiomasRoutes_1.default);
// Rutas de Autenticación
router.use('/auth', AuthRoutes_1.default);
// Rutas de Notificaciones
router.use('/notificaciones', notificaciones_routes_1.default);
// Rutas de Conversaciones (Chat)
router.use('/conversaciones', conversaciones_routes_1.default);
// Rutas de Mensajes (subrutas de conversaciones)
router.use('/conversaciones', mensajes_routes_1.default);
// Rutas de Mensajes individuales (editar y eliminar)
router.use('/mensajes', mensajes_routes_1.mensajesRouter);
// Rutas de Condiciones Médicas (Catálogo, Doctores y Pacientes)
router.use('/condiciones-medicas', CondicionesMedicasRoutes_1.default);
// Rutas de Seguros Médicos
router.use('/seguros', SegurosRoutes_1.default);
// Rutas de Tipos de Seguros
router.use('/tipos-seguros', TiposSegurosRoutes_1.default);
// Rutas de Servicios
router.use('/servicios', ServiciosRoutes_1.default);
// Rutas de Citas
router.use('/citas', CitasRoutes_1.default);
// Rutas de Teleconsultas
router.use('/teleconsultas', TeleconsultasRoutes_1.default);
// Rutas de Reseñas
router.use('/resenas', ResenasRoutes_1.default);
// Rutas de Favoritos
router.use('/favoritos', FavoritosRoutes_1.default);
// Rutas de Media (archivos para el chat)
router.use('/media', MediaRoutes_1.default);
// Rutas de Búsqueda Unificada
router.use('/busqueda', BusquedaRoutes_1.default);
// Rutas de Estadísticas del Admin
router.use('/admin/estadisticas', EstadisticasAdminRoutes_1.default);
// Rutas de Contacto (formulario de contacto y newsletter) — públicas
router.use('/contacto', ContactoRoutes_1.default);
exports.default = router;
