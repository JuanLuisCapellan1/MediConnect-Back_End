import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();
const controller = new AuthController();

/**
 * POST /api/auth/login
 * Login con email y password
 * Body: { email: string, password: string }
 */
router.post('/login', (req, res) => controller.login(req, res));

/**
 * POST /api/auth/refresh
 * Renovar tokens usando un refreshToken
 * Body: { refreshToken: string }
 */
router.post('/refresh', (req, res) => controller.refreshToken(req, res));

export default router;
