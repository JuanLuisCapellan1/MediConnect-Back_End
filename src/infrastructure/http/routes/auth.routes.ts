import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { autenticarJWT } from '../middlewares/autenticacion';

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

/**
 * POST /api/auth/quick-login
 * Login rápido sin password (solo desarrollo)
 * Body: { email: string }
 */
router.post('/quick-login', (req, res) => controller.quickLogin(req, res));

/**
 * POST /api/auth/generate-token
 * Generar token para usuario específico (solo desarrollo)
 * Body: { usuarioId: number }
 */
router.post('/generate-token', (req, res) => controller.generateToken(req, res));

/**
 * POST /api/auth/verify
 * Verificar validez de un token
 * Body: { token: string }
 */
router.post('/verify', (req, res) => controller.verifyToken(req, res));

/**
 * GET /api/auth/me
 * Obtener información del usuario autenticado
 * Header: Authorization: Bearer TOKEN
 */
router.get('/me', autenticarJWT, (req, res) => controller.me(req, res));

export default router;
