"use strict";
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
const SubBarriosRoutes_1 = __importDefault(require("./SubBarriosRoutes"));
const UbicacionesRoutes_1 = __importDefault(require("./UbicacionesRoutes"));
const HorariosRoutes_1 = __importDefault(require("./HorariosRoutes"));
const ServiciosHorariosRoutes_1 = __importDefault(require("./ServiciosHorariosRoutes"));
const TiposServiciosRoutes_1 = __importDefault(require("./TiposServiciosRoutes"));
const TiposCentrosSaludRoutes_1 = __importDefault(require("./TiposCentrosSaludRoutes"));
const ProfesionesRoutes_1 = __importDefault(require("./ProfesionesRoutes"));
const ExperienciasLaboralesRoutes_1 = __importDefault(require("./ExperienciasLaboralesRoutes"));
const AuthRoutes_1 = __importDefault(require("./AuthRoutes"));
const AuthPasswordRoutes_1 = __importDefault(require("./AuthPasswordRoutes"));
const notificaciones_routes_1 = __importDefault(require("./notificaciones.routes"));
const conversaciones_routes_1 = __importDefault(require("./conversaciones.routes"));
const mensajes_routes_1 = __importDefault(require("./mensajes.routes"));
const TranslationMiddleware_1 = require("../middlewares/TranslationMiddleware");
const TranslationRateLimiter_1 = require("../middlewares/TranslationRateLimiter");
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
router.use('/subBarrios', SubBarriosRoutes_1.default);
router.use('/ubicaciones', UbicacionesRoutes_1.default);
// Rutas de horarios
router.use('/horarios', HorariosRoutes_1.default);
// Rutas de Servicios Horarios
router.use('/servicios-horarios', ServiciosHorariosRoutes_1.default);
// Rutas de Tipos de Servicios
router.use('/tipos-servicios', TiposServiciosRoutes_1.default);
// Rutas de Tipos de Centros de Salud
router.use('/tipos-centros-salud', TiposCentrosSaludRoutes_1.default);
// Rutas de Profesiones
router.use('/profesiones', ProfesionesRoutes_1.default);
// Rutas de Experiencias Laborales
router.use('/experiencias-laborales', ExperienciasLaboralesRoutes_1.default);
// Rutas de Autenticación
router.use('/auth', AuthRoutes_1.default);
// Rutas de Notificaciones
router.use('/notificaciones', notificaciones_routes_1.default);
// Rutas de Conversaciones (Chat)
router.use('/conversaciones', conversaciones_routes_1.default);
// Rutas de Mensajes
router.use('/conversaciones', mensajes_routes_1.default);
exports.default = router;
