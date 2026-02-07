import { Router } from 'express';
import multer from 'multer';
import { AuthController } from '../controllers/AuthController';

const routerAuth = Router();

// Configurar multer para recibir archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

// Instanciar controlador
const authController = new AuthController();

/**
 * POST /auth/registro/paciente
 * Completar registro de paciente con archivos
 */
routerAuth.post(
  '/registro/paciente',
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

export default routerAuth;