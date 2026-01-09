import { Router } from 'express';
import { TestTraduccionController } from '../controllers/TestTraduccionController';

const router = Router();
const testController = new TestTraduccionController();

// Ruta temporal para probar
router.get('/test-traduccion', (req, res) => testController.runTest(req, res));

export default router;