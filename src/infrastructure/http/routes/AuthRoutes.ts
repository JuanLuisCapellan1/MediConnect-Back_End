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

// Middleware para manejar errores de Multer con mensajes amigables
const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    // Errores específicos de Multer
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      // Determinar qué campo excedió el límite
      const fieldLimits: Record<string, number> = {
        'fotoPerfil': 1,
        'fotoDocumento': 2,
        'tituloAcademico': 10,
        'certificaciones': 100
      };

      const fieldName = err.field || 'desconocido';
      const maxCount = fieldLimits[fieldName] || 'desconocido';

      let message = '';
      if (fieldName === 'fotoDocumento') {
        message = `Has subido demasiadas fotos de documento. El máximo permitido es ${maxCount}. Por favor, selecciona solo las más importantes.`;
      } else if (fieldName === 'tituloAcademico') {
        message = `Has subido demasiados títulos académicos. El máximo permitido es ${maxCount}. Por favor, selecciona solo los más relevantes.`;
      } else if (fieldName === 'fotoPerfil') {
        message = `Solo puedes subir 1 foto de perfil.`;
      } else {
        message = `Has excedido el límite de archivos para el campo "${fieldName}". Máximo permitido: ${maxCount}.`;
      }

      return res.status(400).json({
        success: false,
        message: message
      });
    } else if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Uno o más archivos exceden el tamaño máximo permitido de 5MB. Por favor, comprime las imágenes o reduce el tamaño de los archivos.'
      });
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Has subido demasiados archivos en total. Por favor, revisa los límites permitidos para cada campo.'
      });
    }
  }

  // Si no es un error de Multer, pasar al siguiente middleware
  next(err);
};

/**
 * POST /auth/registro/doctor
 * Completar registro de doctor con archivos múltiples
 */
routerAuth.post(
  '/registro/doctor',
  preserveAuthHeaders,
  upload.fields([
    { name: 'fotoPerfil', maxCount: 1 },
    { name: 'fotoDocumento', maxCount: 2 },        // Máximo 2 documentos
    { name: 'tituloAcademico', maxCount: 10 },     // Máximo 10 títulos
    { name: 'certificaciones', maxCount: 100 },    // Ilimitadas (límite práctico)
  ]),
  handleMulterError,  // Agregar middleware de manejo de errores
  (req: Request, res: Response) => authController.completarRegistroDoctor(req, res)
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

/**
 * PATCH /auth/foto-perfil
 * Actualiza la foto de perfil del usuario autenticado
 * Requiere: JWT token en Authorization header
 * Body: multipart/form-data con campo 'fotoPerfil'
 */
import { autenticarJWT } from '../middlewares/autenticacion';

routerAuth.patch(
  '/foto-perfil',
  autenticarJWT,
  upload.single('fotoPerfil'),
  (req, res) => authController.actualizarFotoPerfil(req, res)
);

/**
 * GET /auth/verificar-documento
 * Verifica si un número de documento ya está registrado
 * Query params: numero (string)
 */
routerAuth.get('/verificar-documento', (req, res) =>
  authController.verificarDocumento(req, res)
);

/**
 * PATCH /auth/cambiar-email
 * Permite al usuario cambiar su dirección de email
 * Requiere autenticación JWT
 */
routerAuth.patch(
  '/cambiar-email',
  autenticarJWT,
  (req, res) => authController.cambiarEmail(req, res)
);

export default routerAuth;