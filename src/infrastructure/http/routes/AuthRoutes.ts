import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { AuthController } from '../controllers/AuthController';

const routerAuth = Router();

// Configurar multer para recibir archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

// Instanciar controlador
const authController = new AuthController();

// Middleware específico para preservar headers de autorización en rutas de registro
const preserveAuthHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Guardar el header de autorización antes de que multer procese la petición
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader) {
    // Asegurar que el header no se pierda durante el procesamiento
    (req as any).originalAuthorization = authHeader;
  }
  next();
};

/**
 * POST /auth/registro/paciente
 * Completar registro de paciente con archivos
 */
routerAuth.post(
  '/registro/paciente',
  preserveAuthHeaders,
  upload.fields([
    { name: 'fotoPerfil', maxCount: 1 },
    { name: 'fotoDocumento', maxCount: 1 },
  ]),
  (req, res) => authController.completarRegistroPaciente(req, res)
);

/**
 * POST /auth/registro/doctor
 * Completar registro de doctor con archivos
 */
routerAuth.post(
  '/registro/doctor',
  preserveAuthHeaders,
  upload.fields([
    { name: 'fotoPerfil', maxCount: 1 },
    { name: 'fotoDocumento', maxCount: 1 },
    { name: 'tituloAcademico', maxCount: 1 },
    { name: 'certificaciones', maxCount: 1 },
  ]),
  (req, res) => authController.completarRegistroDoctor(req, res)
);

/**
 * POST /auth/registro/solicitar-codigo
 * Solicita un código OTP para el registro
 */
routerAuth.post('/registro/solicitar-codigo', (req, res) =>
  authController.solicitarCodigo(req, res)
);

/**
 * POST /auth/registro/validar-codigo
 * Valida un código OTP y genera un token de registro
 */
routerAuth.post('/registro/validar-codigo', (req, res) =>
  authController.validarCodigo(req, res)
);

/**
 * POST /auth/login
 * Login con email y contraseña. Body { email, password }. Devuelve JWT y usuario.
 */
routerAuth.post('/login', (req, res) => authController.login(req, res));

/**
 * POST /auth/google
 * Login con Google: body { idToken }. Devuelve JWT y datos de usuario (login / vincular / registro rápido).
 */
routerAuth.post('/google', (req, res) => authController.loginGoogle(req, res));

/**
 * POST /auth/google/attach-password
 * Body: { idToken, password }
 */
routerAuth.post('/google/attach-password', (req, res) =>
  authController.attachPasswordGoogle(req, res)
);

/**
 * POST /auth/refresh-access-token
 * Recibe un refreshToken y devuelve un nuevo accessToken y refreshToken
 * Body: { refreshToken: string }
 */
routerAuth.post('/refresh-access-token', (req, res) =>
  authController.refreshAccessToken(req, res)
);

/**
 * POST /auth/password/solicitar-codigo
 * Solicita un código de recuperación al correo
 */
routerAuth.post('/password/solicitar-codigo', (req, res) =>
  authController.solicitarCodigoRecuperacion(req, res)
);

/**
 * POST /auth/password/validar-codigo
 * Valida el código de recuperación y devuelve un token
 */
routerAuth.post('/password/validar-codigo', (req, res) =>
  authController.validarCodigoRecuperacion(req, res)
);

/**
 * POST /auth/password/cambiar
 * Cambia la contraseña usando el token de recuperación (header X-Recovery-Token)
 */
routerAuth.post('/password/cambiar', (req, res) =>
  authController.cambiarPasswordConToken(req, res)
);

export default routerAuth;