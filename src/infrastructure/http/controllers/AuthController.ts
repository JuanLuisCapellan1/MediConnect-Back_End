import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { RegistrarPacienteUseCase } from '../../../application/use-cases/RegistrarPacienteUseCase';
import { RegistrarDoctorUseCase } from '../../../application/use-cases/RegistrarDoctorUseCase';
import { RegistrarPacienteDto } from '../../../application/dtos/RegistrarPacienteDto';
import { RegistrarDoctorDto } from '../../../application/dtos/RegistrarDoctorDto';
import { SolicitarCodigoRegistroUseCase } from '../../../application/use-cases/SolicitarCodigoRegistroUseCase';
import { ValidarCodigoRegistroUseCase } from '../../../application/use-cases/ValidarCodigoRegistroUseCase';
import { LoginGoogleUseCase } from '../../../application/use-cases/LoginGoogleUseCase';
import { LoginUseCase } from '../../../application/use-cases/LoginUseCase';
import { LoginDto } from '../../../application/dtos/LoginDto';
import { RedisNoDisponibleError } from '../../../infrastructure/external-services/RedisCacheService';

/** Recorre recursivamente ValidationError y devuelve todos los mensajes (incl. anidados: ubicacion, formaciones). */
function flattenValidationErrors(errors: ValidationError[], prefix = ''): string[] {
  const messages: string[] = [];
  for (const e of errors) {
    const path = prefix ? `${prefix}.${e.property}` : e.property;
    if (e.constraints) {
      messages.push(...Object.values(e.constraints).map((msg) => (path ? `${path}: ${msg}` : msg)));
    }
    if (e.children?.length) {
      messages.push(...flattenValidationErrors(e.children, path));
    }
  }
  return messages;
}

export class AuthController {
  /**
   * POST /auth/registro/paciente
   * Completa el registro de un paciente
   */
  async completarRegistroPaciente(req: Request, res: Response): Promise<void> {
    try {
      // 1. Validar token
      const token = this.extraerToken(req);
      if (!token) {
        res.status(401).json({
          success: false,
          message:
            'Token de registro no proporcionado. Envía el JWT en el header "Authorization: Bearer <token>" o en el campo del formulario "token". En Swagger con multipart, añade el campo "token" en el Request body y pega el token obtenido de validar-codigo.',
        });
        return;
      }

      // 2. Validar archivos requeridos (solo fotoDocumento es obligatorio; fotoPerfil es opcional)
      if (!req.files || typeof req.files !== 'object') {
        res.status(400).json({
          success: false,
          message: 'No se proporcionaron archivos',
        });
        return;
      }

      const files = req.files as Record<string, Express.Multer.File[]>;

      if (!files.fotoDocumento || !files.fotoDocumento[0]) {
        res.status(400).json({
          success: false,
          message: 'fotoDocumento es requerido',
        });
        return;
      }

      // 3. Transformar y validar DTO
      const dto = plainToInstance(RegistrarPacienteDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const messages = flattenValidationErrors(errors);
        res.status(400).json({
          success: false,
          message: 'Validación fallida',
          errors: messages.length ? messages.join('; ') : 'Errores de validación.',
        });
        return;
      }

      // 4. Ejecutar caso de uso
      const useCase = container.resolve(RegistrarPacienteUseCase);
      await useCase.execute(dto, files, token);

      res.status(201).json({
        success: true,
        message: 'Paciente registrado exitosamente',
      });
    } catch (error) {
      this.manejarError(error, res);
    }
  }

  /**
   * POST /auth/registro/doctor
   * Completa el registro de un doctor
   */
  async completarRegistroDoctor(req: Request, res: Response): Promise<void> {
    try {
      // 1. Validar token
      const token = this.extraerToken(req);
      if (!token) {
        res.status(401).json({
          success: false,
          message:
            'Token de registro no proporcionado. Envía el JWT en el header "Authorization: Bearer <token>" o en el campo del formulario "token". En Swagger con multipart, añade el campo "token" en el Request body y pega el token obtenido de validar-codigo.',
        });
        return;
      }

      // 2. Validar archivos requeridos
      if (!req.files || typeof req.files !== 'object') {
        res.status(400).json({
          success: false,
          message: 'No se proporcionaron archivos',
        });
        return;
      }

      const files = req.files as Record<string, Express.Multer.File[]>;
      const archivosRequeridos = [
        'fotoPerfil',
        'fotoDocumento',
        'tituloAcademico',
        'certificaciones',
      ];

      for (const archivo of archivosRequeridos) {
        if (!files[archivo] || !files[archivo][0]) {
          res.status(400).json({
            success: false,
            message: `${archivo} es requerido`,
          });
          return;
        }
      }

      // 3. Transformar y validar DTO (opciones para convertir tipos en anidados y excluir propiedades no definidas en el DTO)
      const dto = plainToInstance(RegistrarDoctorDto, req.body, {
        enableImplicitConversion: true,
        excludeExtraneousValues: false,
      });
      const errors = await validate(dto, { forbidNonWhitelisted: false });

      if (errors.length > 0) {
        const messages = flattenValidationErrors(errors);
        res.status(400).json({
          success: false,
          message: 'Validación fallida',
          errors: messages.length ? messages.join('; ') : 'Errores de validación en campos anidados.',
        });
        return;
      }

      // 4. Ejecutar caso de uso
      const useCase = container.resolve(RegistrarDoctorUseCase);
      await useCase.execute(dto, files, token);

      res.status(201).json({
        success: true,
        message: 'Doctor registrado exitosamente. Su solicitud está en revisión.',
      });
    } catch (error) {
      this.manejarError(error, res);
    }
  }

  /**
   * POST /auth/registro/solicitar-codigo
   * Solicita un código OTP para el registro
   */
  async solicitarCodigo(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'El correo electrónico es requerido.',
        });
        return;
      }

      const useCase = container.resolve(SolicitarCodigoRegistroUseCase);
      await useCase.execute(email);

      res.status(200).json({
        success: true,
        message: 'Código de registro enviado al correo electrónico.',
      });
    } catch (error) {
      this.manejarError(error, res);
    }
  }

  /**
   * POST /auth/registro/validar-codigo
   * Valida un código OTP y genera un token de registro
   */
  async validarCodigo(req: Request, res: Response): Promise<void> {
    try {
      const { email, codigo } = req.body;

      if (!email || !codigo) {
        res.status(400).json({
          success: false,
          message: 'El correo electrónico y el código son requeridos.',
        });
        return;
      }

      const useCase = container.resolve(ValidarCodigoRegistroUseCase);
      const token = await useCase.execute(email, codigo);

      res.status(200).json({
        success: true,
        message: 'Código validado correctamente.',
        data: { token },
      });
    } catch (error) {
      this.manejarError(error, res);
    }
  }

  /**
   * Extrae el token JWT del header Authorization o del body (multipart).
   * Swagger UI a veces no envía el header Authorization en peticiones multipart/form-data;
   * por eso se acepta también un campo "token" o "authorization" en req.body.
   */
  private extraerToken(req: Request): string | null {
    // 1. Header (Express normaliza headers a minúsculas)
    const authHeader = req.headers.authorization ?? req.headers.Authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }

    // 2. Body (útil cuando Swagger/envíos multipart no incluyen el header)
    const body = req.body as Record<string, unknown>;
    if (body && typeof body === 'object') {
      const fromBody = body.token ?? body.authorization;
      if (typeof fromBody === 'string') {
        const value = fromBody.trim();
        return value.startsWith('Bearer ') ? value.substring(7).trim() : value;
      }
    }

    return null;
  }

  /**
   * Maneja errores de forma consistente
   */
  private manejarError(error: unknown, res: Response): void {
    console.error('Error en AuthController:', error);

    if (error instanceof RedisNoDisponibleError) {
      res.status(503).json({
        success: false,
        message: 'Servicio de validación temporalmente no disponible. Por favor, intenta más tarde.',
      });
      return;
    }

    if (error instanceof Error) {
      const message = error.message;

      // Errores específicos
      if (message.includes('Token')) {
        res.status(401).json({
          success: false,
          message: 'Token inválido o expirado',
        });
        return;
      }

      if (message.includes('Configuración')) {
        res.status(500).json({
          success: false,
          message: 'Error de configuración del servidor',
        });
        return;
      }

      if (message.includes('duplicado') || message.includes('UNIQUE')) {
        res.status(409).json({
          success: false,
          message: 'El usuario ya existe',
        });
        return;
      }

      res.status(400).json({
        success: false,
        message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }

  /**
   * POST /auth/login
   * Login con email y contraseña. Devuelve JWT y datos del usuario.
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const dto = plainToInstance(LoginDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        const messages = flattenValidationErrors(errors);
        res.status(400).json({
          success: false,
          message: messages.length > 0 ? messages[0] : 'Datos de login inválidos',
        });
        return;
      }

      const loginUseCase = container.resolve(LoginUseCase);
      const result = await loginUseCase.execute(dto);

      res.status(200).json({
        success: true,
        token: result.token,
        usuario: result.usuario,
      });
    } catch (error) {
      if (error instanceof Error) {
        const message = error.message;
        if (message === 'Credenciales inválidas') {
          res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
          return;
        }
        if (message === 'Usuario inactivo o bloqueado') {
          res.status(403).json({ success: false, message: 'Usuario inactivo o bloqueado.' });
          return;
        }
        res.status(400).json({ success: false, message });
        return;
      }
      res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
  }

  /**
   * POST /auth/google
   * Login con Google: recibe idToken, verifica con Google y devuelve JWT (login / vincular / registro rápido).
   */
  async loginGoogle(req: Request, res: Response): Promise<void> {
    try {
      const idToken = req.body?.idToken ?? req.body?.id_token;
      if (!idToken || typeof idToken !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Se requiere el idToken de Google en el body (idToken o id_token).',
        });
        return;
      }

      const loginGoogleUseCase = container.resolve(LoginGoogleUseCase);
      const result = await loginGoogleUseCase.execute(idToken);

      res.status(200).json({
        success: true,
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      if (error instanceof Error) {
        const message = error.message;
        if (message.includes('Token') || message.includes('inválido')) {
          res.status(401).json({ success: false, message: 'Token de Google inválido o expirado.' });
          return;
        }
        if (message.includes('GOOGLE_CLIENT_ID')) {
          res.status(500).json({ success: false, message: 'Configuración de Google no disponible.' });
          return;
        }
        res.status(400).json({ success: false, message });
        return;
      }
      res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
  }
}