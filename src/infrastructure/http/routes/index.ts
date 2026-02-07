import { Router } from 'express';

// Importar todas las rutas
import ProvinciaRoutes from './ProvinciasRoutes';
import MunicipiosRoutes from './MunicipiosRoutes';
import DistritosMunicipalesRoutes from './DistritosMunicipalesRoutes';
import SeccionesRoutes from './SeccionesRoutes';
import BarriosRoutes from './BarriosRoutes';
import SubBarriosRoutes from './SubBarriosRoutes';
import UbicacionesRoutes from './UbicacionesRoutes';
import HorariosRoutes from './HorariosRoutes';
import AuthRoutes from './AuthRoutes'; // ✅ AGREGAR

const router = Router();

// Rutas de autenticación
router.use('/auth', AuthRoutes);

// Rutas de geografía
router.use('/provincias', ProvinciaRoutes);
router.use('/municipios', MunicipiosRoutes);
router.use('/distritos', DistritosMunicipalesRoutes);
router.use('/secciones', SeccionesRoutes);
router.use('/barrios', BarriosRoutes);
router.use('/subBarrios', SubBarriosRoutes);
router.use('/ubicaciones', UbicacionesRoutes);

// Rutas de horarios
router.use('/horarios', HorariosRoutes);

export default router;