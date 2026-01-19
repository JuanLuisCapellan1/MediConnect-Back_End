import { Router } from 'express';
import { TraduccionController } from '../controllers/TraduccionController';

const router = Router();
const traduccionController = new TraduccionController();

router.post('/traduccion', (req, res) => traduccionController.traslate(req, res));

export default router;