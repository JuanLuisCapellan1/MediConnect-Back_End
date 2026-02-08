import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import jwt from 'jsonwebtoken'; // De develop (para utilidades)
import { PrismaClient } from '@prisma/client'; // De develop (para utilidades)

// Use Cases (Tuyos - Clean Architecture)
import { RegistrarPacienteUseCase } from '../../../application/use-cases/RegistrarPacienteUseCase';
import { RegistrarDoctorUseCase } from '../../../application/use-cases/RegistrarDoctorUseCase';
import { SolicitarCodigoRegistroUseCase } from '../../../application/use-cases/SolicitarCodigoRegistroUseCase';
import { ValidarCodigoRegistroUseCase } from '../../../application/use-cases/ValidarCodigoRegistroUseCase';
import { LoginGoogleUseCase } from '../../../application/use-cases/LoginGoogleUseCase';
import { LoginUseCase } from '../../../application/use-cases/LoginUseCase';

// DTOs (Tuyos)
import { RegistrarPacienteDto } from '../../../application/dtos/RegistrarPacienteDto';
import { RegistrarDoctorDto } from '../../../application/dtos/RegistrarDoctorDto';
import { LoginDto } from '../../../application/dtos/LoginDto';

// Errores y Servicios
import { RedisNoDisponibleError } from '../../../infrastructure/external-services/RedisCacheService';

/** Recorre recursivamente ValidationError y devuelve todos los mensajes */
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
  
  // ===========================================================================
  // MÉTODOS DE PRODUCCIÓN (Clean Architecture - TUS CAMBIOS)
  // ===========================================================================

  /**
   * POST /auth/registro/paciente
   */
  async completarRegistroPaciente(req: Request, res: Response): Promise<void> {
    try {
      const token = this.extraerToken(req);
      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Token de registro no proporcionado.',
        });
        return;
      }

      if (!req.files || typeof req.files !== 'object') {
        res.status(400).json({ success: false, message: 'No se proporcionaron archivos' });
        return;
      }

      const files = req.files as Record<string, Express.Multer.File[]>;
      if (!files.fotoDocumento || !files.fotoDocumento[0]) {
        res.status(400).json({ success: false, message: 'fotoDocumento es requerido' });
        return;
      }

      const dto = plainToInstance(RegistrarPacienteDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const messages = flattenValidationErrors(errors);
        res.status(400).json({
          success: false,
          message: 'Validación fallida',
          errors: messages.join('; '),
        });
        return;
      }

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
   */
  async completarRegistroDoctor(req: Request, res: Response): Promise<void> {
    try {
      const token = this.extraerToken(req);
      if (!token) {
        res.status(401).json({ success: false, message: 'Token de registro no proporcionado.' });
        return;
      }

      if (!req.files || typeof req.files !== 'object') {
        res.status(400).json({ success: false, message: 'No se proporcionaron archivos' });
        return;
      }

      const files = req.files as Record<string, Express.Multer.File[]>;
      const archivosRequeridos = ['fotoPerfil', 'fotoDocumento', 'tituloAcademico', 'certificaciones'];

      for (const archivo of archivosRequeridos) {
        if (!files[archivo] || !files[archivo][0]) {
          res.status(400).json({ success: false, message: `${archivo} es requerido` });
          return;
        }
      }

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
          errors: messages.join('; '),
        });
        return;
      }

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
   */
  async solicitarCodigo(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ success: false, message: 'El correo electrónico es requerido.' });
        return;
      }

      const useCase = container.resolve(SolicitarCodigoRegistroUseCase);
      await useCase.execute(email);

      res.status(200).json({ success: true, message: 'Código de registro enviado al correo electrónico.' });
    } catch (error) {
      this.manejarError(error, res);
    }
  }

  /**
   * POST /auth/registro/validar-codigo
   */
  async validarCodigo(req: Request, res: Response): Promise<void> {
    try {
      const { email, codigo } = req.body;
      if (!email || !codigo) {
        res.status(400).json({ success: false, message: 'Email y código son requeridos.' });
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
   * POST /auth/login
   * Login oficial usando Casos de Uso
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const dto = plainToInstance(LoginDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Datos de login inválidos',
          errors: flattenValidationErrors(errors),
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
      this.manejarError(error, res);
    }
  }

  /**
   * POST /auth/google
   */
  async loginGoogle(req: Request, res: Response): Promise<void> {
    try {
      const idToken = req.body?.idToken ?? req.body?.id_token;
      if (!idToken || typeof idToken !== 'string') {
        res.status(400).json({ success: false, message: 'Se requiere idToken de Google.' });
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
      this.manejarError(error, res);
    }
  }

  // ===========================================================================
  // MÉTODOS DE UTILIDAD / DESARROLLO (De tu compañero)
  // ===========================================================================

  /**
   * POST /api/auth/quick-login
   */
  async quickLogin(req: Request, res: Response): Promise<Response | void> {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email es requerido' });

      const prisma = container.resolve<PrismaClient>('PrismaClient');
      const usuario = await prisma.usuario.findUnique({ where: { email } });

      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

      const secreto = process.env.JWT_SECRET || 'secret-key-temporal';
      const token = jwt.sign(
        { userId: usuario.id, email: usuario.email, rol: usuario.rol },
        secreto,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        mensaje: 'Quick login exitoso (DEV)',
        data: { token, usuario: { id: usuario.id, email: usuario.email, rol: usuario.rol, fotoPerfil: usuario.fotoPerfil } },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  /**
   * POST /api/auth/generate-token
   */
  async generateToken(req: Request, res: Response): Promise<Response | void> {
    try {
      const { usuarioId } = req.body;
      if (!usuarioId) return res.status(400).json({ error: 'usuarioId requerido' });

      const prisma = container.resolve<PrismaClient>('PrismaClient');
      const usuario = await prisma.usuario.findUnique({ where: { id: Number(usuarioId) } });

      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

      const secreto = process.env.JWT_SECRET || 'secret-key-temporal';
      const token = jwt.sign(
        { userId: usuario.id, email: usuario.email, rol: usuario.rol },
        secreto,
        { expiresIn: '24h' }
      );

      return res.status(200).json({ mensaje: 'Token generado', data: { token } });
    } catch (error) {
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  /**
   * POST /api/auth/verify
   */
  async verifyToken(req: Request, res: Response): Promise<Response | void> {
    try {
      const { token } = req.body;
      if (!token) return res.status(400).json({ error: 'Token requerido' });

      const secreto = process.env.JWT_SECRET || 'secret-key-temporal';
      const decoded = jwt.verify(token, secreto);

      return res.status(200).json({ mensaje: 'Token válido', data: decoded });
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
  }

  /**
   * GET /api/auth/me
   */
  async me(req: Request, res: Response): Promise<Response | void> {
    try {
      const usuarioId = (req as any).usuarioId;
      if (!usuarioId) return res.status(401).json({ error: 'No autenticado' });

      const prisma = container.resolve<PrismaClient>('PrismaClient');
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: {
          id: true, email: true, rol: true, fotoPerfil: true,
          telefono: true, emailVerificado: true, estado: true, creadoEn: true
        }
      });

      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

      return res.status(200).json({ mensaje: 'Usuario autenticado', data: usuario });
    } catch (error) {
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  // ===========================================================================
  // HELPERS PRIVADOS
  // ===========================================================================

  private extraerToken(req: Request): string | null {
    const authHeader = req.headers.authorization ?? req.headers.Authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
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

  private manejarError(error: unknown, res: Response): void {
    console.error('Error Auth:', error);

    if (error instanceof RedisNoDisponibleError) {
      res.status(503).json({ success: false, message: 'Servicio de validación no disponible.' });
      return;
    }

    if (error instanceof Error) {
      const msg = error.message;
      if (msg === 'Credenciales inválidas') {
        res.status(401).json({ success: false, message: msg });
        return;
      }
      if (msg.includes('Token')) {
        res.status(401).json({ success: false, message: 'Token inválido o expirado' });
        return;
      }
      res.status(400).json({ success: false, message: msg });
      return;
    }

    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
}