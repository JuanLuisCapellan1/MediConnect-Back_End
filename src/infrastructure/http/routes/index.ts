import { Router } from 'express';
import { TestTraduccionController } from '../controllers/TestTraduccionController';

const router = Router();
const testController = new TestTraduccionController();

router.get('/test-traduccion', (req, res) => testController.runTest(req, res));

export default router;