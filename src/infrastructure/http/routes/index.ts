import { Router } from 'express';
import { TraduccionController } from '../controllers/TraduccionController';
import { TranslationUtilsController } from '../controllers/TranslationUtilsController';
import ProvinciasRoutes from './ProvinciasRoutes';
import MunicipiosRoutes from './MunicipiosRoutes';
import DistritosMunicipalesRoutes from './DistritosMunicipalesRoutes';
import SeccionesRoutes from './SeccionesRoutes';
import BarriosRoutes from './BarriosRoutes';
import UbicacionesRoutes from './UbicacionesRoutes';
import HorariosRoutes from './HorariosRoutes';
import ServicioHorarioRoutes from './ServiciosHorariosRoutes';
import EspecialidadesRoutes from './EspecialidadesRoutes';
import PacientesRoutes from './PacientesRoutes';
import DoctoresRoutes from './DoctoresRoutes';
import AccionesRoutes from './AccionesRoutes';
import TiposCentrosSaludRoutes from './TiposCentrosSaludRoutes';
import CentrosSaludRoutes from './CentrosSaludRoutes';

import ExperienciasLaboralesRoutes from './ExperienciasLaboralesRoutes';
import FormacionesAcademicasRoutes from './FormacionesAcademicasRoutes';
import PaisesRoutes from './PaisesRoutes';
import UniversidadesRoutes from './UniversidadesRoutes';
import AuthRoutes from './AuthRoutes';
import AuthPasswordRoutes from './AuthPasswordRoutes';
import NotificacionesRoutes from './notificaciones.routes';
import ConversacionesRoutes from './conversaciones.routes';
import MensajesRoutes from './mensajes.routes';
import CondicionesMedicasRoutes from './CondicionesMedicasRoutes';
import SegurosRoutes from './SegurosRoutes';
import TiposSegurosRoutes from './TiposSegurosRoutes';
import ServiciosRoutes from './ServiciosRoutes';
import { translationMiddleware } from '../middlewares/TranslationMiddleware';
import { translationRateLimitMiddleware } from '../middlewares/TranslationRateLimiter';
import DoctorIdiomasRoutes from './DoctorIdiomasRoutes';
import CitasRoutes from './CitasRoutes';
import ResenasRoutes from './ResenasRoutes';

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
router.use('/auth', AuthPasswordRoutes);

// Rutas de geografía
router.use('/provincias', ProvinciasRoutes);
router.use('/municipios', MunicipiosRoutes);
router.use('/distritos', DistritosMunicipalesRoutes);
router.use('/secciones', SeccionesRoutes);
router.use('/barrios', BarriosRoutes);
router.use('/ubicaciones', UbicacionesRoutes);
router.use('/paises', PaisesRoutes);
router.use('/universidades', UniversidadesRoutes);

// Rutas de horarios
router.use('/horarios', HorariosRoutes);

// Rutas de Servicios Horarios
router.use('/servicios-horarios', ServicioHorarioRoutes);


// Rutas de Especialidades
router.use('/especialidades', EspecialidadesRoutes);

// Rutas de Pacientes
router.use('/pacientes', PacientesRoutes);

// Rutas de Doctores
router.use('/doctores', DoctoresRoutes);

// Rutas de Acciones (Revisión de Documentos)
router.use('/acciones', AccionesRoutes);

// Rutas de Tipos de Centros de Salud
router.use('/tipos-centros-salud', TiposCentrosSaludRoutes);

// Rutas de Centros de Salud
router.use('/centros-salud', CentrosSaludRoutes);



// Rutas de Experiencias Laborales
router.use('/experiencias-laborales', ExperienciasLaboralesRoutes);

// Rutas de Formaciones Académicas
router.use('/formaciones-academicas', FormacionesAcademicasRoutes);

// Rutas de Doctor Idiomas
router.use('/doctores/idiomas', DoctorIdiomasRoutes);


// Rutas de Autenticación
router.use('/auth', AuthRoutes);

// Rutas de Notificaciones
router.use('/notificaciones', NotificacionesRoutes);

// Rutas de Conversaciones (Chat)
router.use('/conversaciones', ConversacionesRoutes);

// Rutas de Mensajes
router.use('/conversaciones', MensajesRoutes);

// Rutas de Condiciones Médicas (Catálogo, Doctores y Pacientes)
router.use('/condiciones-medicas', CondicionesMedicasRoutes);

// Rutas de Seguros Médicos
router.use('/seguros', SegurosRoutes);

// Rutas de Tipos de Seguros
router.use('/tipos-seguros', TiposSegurosRoutes);

// Rutas de Servicios
router.use('/servicios', ServiciosRoutes);

// Rutas de Citas
router.use('/citas', CitasRoutes);

// Rutas de Reseñas
router.use('/resenas', ResenasRoutes);

export default router;
