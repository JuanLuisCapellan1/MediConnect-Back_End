import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { CompletarPerfilCentroSaludUseCase } from '../../../application/use-cases/CompletarPerfilCentroSaludUseCase';
import { CompletarPerfilCentroSaludDto } from '../../../application/dtos/CompletarPerfilCentroSaludDto';
import { RegistrarCentroUseCase } from '../../../application/use-cases/RegistrarCentroUseCase';
import { CentroSaludNoEncontradoError } from '../../../domain/errors/CentrosSalud/CentroSaludNoEncontradoError';
import { TipoCentroSaludNoEncontradoError } from '../../../domain/errors/TiposCentrosSalud/TipoCentroSaludNoEncontradoError';

/**
 * Utilidad para aplanar errores de validación
 */
function flattenValidationErrors(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  errors.forEach((error) => {
    if (error.constraints) {
      messages.push(...Object.values(error.constraints));
    }
    if (error.children && error.children.length > 0) {
      messages.push(...flattenValidationErrors(error.children));
    }
  });
  return messages;
}

@injectable()
export class CentrosSaludController {
  constructor(
    @inject(CompletarPerfilCentroSaludUseCase)
    private completarPerfilUseCase: CompletarPerfilCentroSaludUseCase
    ,
    @inject(RegistrarCentroUseCase)
    private registrarCentroUseCase: RegistrarCentroUseCase
  ) { }

  /**
   * POST /centros-salud/completar-perfil
   * Completa el perfil de un centro de salud autenticado
   * 
   * Headers requeridos:
   * - Authorization: Bearer <token>
   * 
   * Form Data:
   * - nombreComercial: string (requerido)
   * - telefono: string (requerido)
   * - sitioWeb: string (opcional, URL válida)
   * - descripcion: string (opcional)
   * - tipoCentroId: number (requerido)
   * - direccion: string (requerido)
   * - barrioId: number (requerido)
   * - subBarrioId: number (opcional)
   * - codigoPostal: string (opcional)
   * - puntoGeografico: string (opcional, GeoJSON)
   * - certificadoSanitario: file (requerido, PDF)
   * - fotoPerfil: file (opcional, JPG/PNG)
   */
  async completarPerfil(req: Request, res: Response): Promise<void> {
    console.log('🏥 Iniciando completarPerfil:', {
      usuarioId: (req as any).usuarioId,
      email: (req as any).email,
      hasFiles: !!req.files,
      filesCount: req.files ? Object.keys(req.files).length : 0,
      contentType: req.headers['content-type']
    });

    try {
      // ===================================================================
      // 1. OBTENER USUARIO AUTENTICADO DEL REQUEST
      // ===================================================================
      const usuarioId = (req as any).usuarioId;

      // Si no hay usuarioId intentamos flujo de registro usando token de registro
      if (!usuarioId) {
        // Extraer token del header Authorization (acepta 'Bearer ' o token puro)
        let authHeader = (req as any).originalAuthorization || req.headers.authorization || req.headers.Authorization;
        if (!authHeader) {
          authHeader = (req.headers as any)['authorization'] ?? (req.headers as any)['Authorization'] ?? req.headers['x-authorization'] ?? req.headers['X-Authorization'];
        }

        let token: string | null = null;
        if (typeof authHeader === 'string') {
          const trimmed = authHeader.trim();
          token = trimmed.startsWith('Bearer ') ? trimmed.substring(7).trim() : trimmed;
        }

        if (!token) {
          res.status(401).json({ success: false, message: 'Token de registro no proporcionado' });
          return;
        }

        // Validaciones de archivos y DTO se comparten con el otro flujo más abajo
        const files = (req.files as Record<string, Express.Multer.File[]>) ?? {};

        // Validar archivos requeridos
        if (!files.certificadoSanitario?.[0]) {
          res.status(400).json({ success: false, message: 'El certificado sanitario es obligatorio' });
          return;
        }

        // Validar DTO
        const dtoReg = plainToInstance(CompletarPerfilCentroSaludDto, req.body, {
          enableImplicitConversion: true,
          excludeExtraneousValues: false,
        });

        const errorsReg = await validate(dtoReg, { forbidNonWhitelisted: false, skipMissingProperties: false });
        if (errorsReg.length > 0) {
          const messages = flattenValidationErrors(errorsReg);
          res.status(400).json({ success: false, message: 'Validación fallida', errors: messages });
          return;
        }

        // Ejecutar use-case de registro para centros con el token de registro
        await this.registrarCentroUseCase.execute(dtoReg, files, token);

        res.status(201).json({ success: true, message: 'Centro registrado exitosamente. Su solicitud está en revisión.' });
        return;
      }

      // ===================================================================
      // 2. VALIDAR ARCHIVOS REQUERIDOS
      // ===================================================================
      const files = (req.files as Record<string, Express.Multer.File[]>) ?? {};

      if (!files.certificadoSanitario?.[0]) {
        res.status(400).json({
          success: false,
          message: 'El certificado sanitario es obligatorio',
        });
        return;
      }

      // Validar tipos MIME
      const mimesCertificado = ['application/pdf'];
      if (!mimesCertificado.includes(files.certificadoSanitario[0].mimetype)) {
        res.status(400).json({
          success: false,
          message: 'El certificado sanitario debe ser un archivo PDF',
        });
        return;
      }

      if (files.fotoPerfil?.[0]) {
        const mimesFoto = ['image/jpeg', 'image/png', 'image/webp'];
        if (!mimesFoto.includes(files.fotoPerfil[0].mimetype)) {
          res.status(400).json({
            success: false,
            message: 'La foto de perfil debe ser JPG, PNG o WebP',
          });
          return;
        }
      }

      // ===================================================================
      // 3. VALIDAR DTO
      // ===================================================================
      const dto = plainToInstance(CompletarPerfilCentroSaludDto, req.body, {
        enableImplicitConversion: true,
        excludeExtraneousValues: false,
      });

      const errors = await validate(dto, {
        forbidNonWhitelisted: false,
        skipMissingProperties: false,
      });

      if (errors.length > 0) {
        const messages = flattenValidationErrors(errors);
        res.status(400).json({
          success: false,
          message: 'Validación fallida',
          errors: messages,
        });
        return;
      }

      // ===================================================================
      // 4. EJECUTAR USE CASE
      // ===================================================================
      const resultado = await this.completarPerfilUseCase.execute(
        usuarioId,
        dto,
        files
      );

      res.status(200).json({
        success: true,
        message: resultado.message,
        data: {
          id: resultado.id,
          nombreComercial: resultado.nombreComercial,
          estado: resultado.estado,
          estadoVerificacion: resultado.estadoVerificacion,
        },
      });
    } catch (error) {
      this.manejarError(error, res);
    }
  }

  /**
   * Manejador centralizado de errores
   */
  private manejarError(error: any, res: Response): void {
    // Manejo en línea de errores de Prisma (sin depender de utils eliminadas)
    const e: any = error as any;
    if (e && typeof e === 'object') {
      if (e.code === 'P2002') {
        const target = e.meta?.target;
        const fields = Array.isArray(target) ? target.join(', ') : target;
        res.status(409).json({ success: false, message: `Valor duplicado en campo(s): ${fields}` });
        return;
      }
      if (e.code === 'P2025') {
        res.status(404).json({ success: false, message: 'Registro no encontrado' });
        return;
      }
    }

    if (error instanceof CentroSaludNoEncontradoError) {
      res.status(404).json({ success: false, message: error.message });
      return;
    }

    if (error instanceof TipoCentroSaludNoEncontradoError) {
      res.status(404).json({ success: false, message: error.message });
      return;
    }

    if (error?.message?.includes('El certificado sanitario')) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    if (error?.message?.includes('transacción')) {
      res.status(500).json({ success: false, message: 'Error al procesar la solicitud. Intente de nuevo.' });
      return;
    }

    console.error('Error en completarPerfil:', error);
    res.status(500).json({ success: false, message: error.message || 'Error interno del servidor' });
  }
}