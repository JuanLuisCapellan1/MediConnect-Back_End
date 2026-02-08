import { Router } from 'express';
import { TraduccionController } from '../controllers/TraduccionController';
import { TranslationUtilsController } from '../controllers/TranslationUtilsController';
import ProvinciasRoutes from './ProvinciasRoutes';
import MunicipiosRoutes from './MunicipiosRoutes';
import DistritosMunicipalesRoutes from './DistritosMunicipalesRoutes';
import SeccionesRoutes from './SeccionesRoutes';
import BarriosRoutes from './BarriosRoutes';
import SubBarriosRoutes from './SubBarriosRoutes';
import UbicacionesRoutes from './UbicacionesRoutes';
import HorariosRoutes from './HorariosRoutes';
import ServicioHorarioRoutes from './ServiciosHorariosRoutes';
import TiposServiciosRoutes from './TiposServiciosRoutes';
import TiposCentrosSaludRoutes from './TiposCentrosSaludRoutes';
import ProfesionesRoutes from './ProfesionesRoutes';
import ExperienciasLaboralesRoutes from './ExperienciasLaboralesRoutes';
import AuthRoutes from './AuthRoutes';
import NotificacionesRoutes from './notificaciones.routes';
// import AuthRoutes from './auth.routes'; Comente esto porque pensé que lo estabas utilizando para prueba, cualquier cosa lo elimina y me deja saber
import ConversacionesRoutes from './conversaciones.routes';
import MensajesRoutes from './mensajes.routes';
import { translationMiddleware } from '../middlewares/TranslationMiddleware';
import { translationRateLimitMiddleware } from '../middlewares/TranslationRateLimiter';

const router = Router();
const traduccionController = new TraduccionController();
const translationUtilsController = new TranslationUtilsController();

// Aplicar rate limiting para traducciones (debe ir primero)
router.use(translationRateLimitMiddleware);

// Aplicar el middleware de traducción a todas las rutas
router.use(translationMiddleware);

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
router.use('/auth', AuthRoutes);

// Rutas de geografía
router.use('/provincias', ProvinciasRoutes);
router.use('/municipios', MunicipiosRoutes);
router.use('/distritos', DistritosMunicipalesRoutes);
router.use('/secciones', SeccionesRoutes);
router.use('/barrios', BarriosRoutes);
router.use('/subBarrios', SubBarriosRoutes);
router.use('/ubicaciones', UbicacionesRoutes);

// Rutas de horarios
router.use('/horarios', HorariosRoutes);

// Rutas de Servicios Horarios
router.use('/servicios-horarios', ServicioHorarioRoutes);

// Rutas de Tipos de Servicios
router.use('/tipos-servicios', TiposServiciosRoutes);

// Rutas de Tipos de Centros de Salud
router.use('/tipos-centros-salud', TiposCentrosSaludRoutes);

// Rutas de Profesiones
router.use('/profesiones', ProfesionesRoutes);

// Rutas de Experiencias Laborales
router.use('/experiencias-laborales', ExperienciasLaboralesRoutes);

// Rutas de Autenticación
router.use('/auth', AuthRoutes);

// Rutas de Notificaciones
router.use('/notificaciones', NotificacionesRoutes);

// Rutas de Conversaciones (Chat)
router.use('/conversaciones', ConversacionesRoutes);

// Rutas de Mensajes
router.use('/conversaciones', MensajesRoutes);

export default router;