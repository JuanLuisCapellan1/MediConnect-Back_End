import { Router } from 'express';
import { TraduccionController } from '../controllers/TraduccionController';
import ProvinciasRoutes from './ProvinciasRoutes';
import MunicipiosRoutes from './MunicipiosRoutes';
import DistritosMunicipalesRoutes from './DistritosMunicipalesRoutes';
import SeccionesRoutes from './SeccionesRoutes';
import BarriosRoutes from './BarriosRoutes';
import SubBarriosRoutes from './SubBarriosRoutes';
import UbicacionesRoutes from './UbicacionesRoutes';
import HorariosRoutes from './HorariosRoutes';
import ServicioHorarioRoutes from './serviciosHorariosRoutes';

const router = Router();
const traduccionController = new TraduccionController();
    
router.post('/traduccion', (req, res) => traduccionController.traslate(req, res));

// Rutas de Provincias
router.use('/provincias', ProvinciasRoutes);

// Rutas de Municipios
router.use('/municipios', MunicipiosRoutes);

// Rutas de Distritos Municipales
router.use('/distritos', DistritosMunicipalesRoutes);

// Rutas de Secciones
router.use('/secciones', SeccionesRoutes);

// Rutas de Barrios
router.use('/barrios', BarriosRoutes);

// Rutas de Sub Barrios
router.use('/subBarrios', SubBarriosRoutes);

// Rutas de Ubicaciones
router.use('/ubicaciones', UbicacionesRoutes);

// Rutas de Horarios
router.use('/horarios', HorariosRoutes);

// Rutas de Servicios Horarios
router.use('/servicios-horarios', ServicioHorarioRoutes);
export default router;