import { Router } from 'express';
import { TraduccionController } from '../controllers/TraduccionController';
import ProvinciasRoutes from './ProvinciasRoutes';

const router = Router();
const traduccionController = new TraduccionController();
    
router.post('/traduccion', (req, res) => traduccionController.traslate(req, res));

// Rutas de Provincias
router.use('/provincias', ProvinciasRoutes);

export default router;