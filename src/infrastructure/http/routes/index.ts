import { Router } from 'express';
import { TraduccionController } from '../controllers/TraduccionController';
import ProvinciasRoutes from './ProvinciasRoutes';
import MunicipiosRoutes from './MunicipiosRoutes';
import DistritosMunicipalesRoutes from './DistritosMunicipalesRoutes';

const router = Router();
const traduccionController = new TraduccionController();
    
router.post('/traduccion', (req, res) => traduccionController.traslate(req, res));

// Rutas de Provincias
router.use('/provincias', ProvinciasRoutes);

// Rutas de Municipios
router.use('/municipios', MunicipiosRoutes);

// Rutas de Distritos Municipales
router.use('/distritos', DistritosMunicipalesRoutes);

export default router;