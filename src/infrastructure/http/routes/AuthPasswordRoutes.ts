import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();
const controller = new AuthController();

/**
 * POST /api/auth/password/solicitar-codigo
 * Body: { email: string }
 */
router.post('/password/solicitar-codigo', (req, res) =>
  controller.solicitarCodigoRecuperacion(req, res)
);

/**
 * POST /api/auth/password/validar-codigo
 * Body: { email: string, codigo: string }
 */
router.post('/password/validar-codigo', (req, res) =>
  controller.validarCodigoRecuperacion(req, res)
);

/**
 * POST /api/auth/password/cambiar
 * Body: { token: string, nuevaPassword: string, confirmarPassword: string }
 */
router.post('/password/cambiar', (req, res) =>
  controller.cambiarPasswordConToken(req, res)
);

export default router;

