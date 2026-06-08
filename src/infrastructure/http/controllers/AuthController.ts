import { Request, Response } from "express";
import { container } from "tsyringe";
import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import jwt from "jsonwebtoken"; // De develop (para utilidades)
import { PrismaClient } from "@prisma/client"; // De develop (para utilidades)

// Use Cases (Tuyos - Clean Architecture)
import { RegistrarPacienteUseCase } from "../../../application/use-cases/RegistrarPacienteUseCase";
import { RegistrarDoctorUseCase } from "../../../application/use-cases/RegistrarDoctorUseCase";
import { SolicitarCodigoRegistroUseCase } from "../../../application/use-cases/SolicitarCodigoRegistroUseCase";
import { ValidarCodigoRegistroUseCase } from "../../../application/use-cases/ValidarCodigoRegistroUseCase";
import { LoginGoogleUseCase } from "../../../application/use-cases/LoginGoogleUseCase";
import { LoginUseCase } from "../../../application/use-cases/LoginUseCase";
import { RefreshTokenUseCase } from "../../../application/use-cases/RefreshTokenUseCase";
import { SolicitarRecuperacionPasswordUseCase } from "../../../application/use-cases/SolicitarRecuperacionPasswordUseCase";
import { ValidarCodigoRecuperacionPasswordUseCase } from "../../../application/use-cases/ValidarCodigoRecuperacionPasswordUseCase";
import { CambiarPasswordConTokenUseCase } from "../../../application/use-cases/CambiarPasswordConTokenUseCase";
import { CambiarPasswordAutenticadoUseCase } from "../../../application/use-cases/CambiarPasswordAutenticadoUseCase";
import { RefreshAccessTokenUseCase } from "../../../application/use-cases/RefreshAccessTokenUseCase";
import { AttachPasswordToGoogleAccountUseCase } from "../../../application/use-cases/AttachPasswordToGoogleAccountUseCase";
import { ActualizarFotoPerfilUseCase } from "../../../application/use-cases/ActualizarFotoPerfilUseCase";
import { ActualizarBannerUseCase } from "../../../application/use-cases/ActualizarBannerUseCase";
import { VerificarDocumentoUseCase } from "../../../application/use-cases/VerificarDocumentoUseCase";
import { CambiarEmailUseCase } from "../../../application/use-cases/CambiarEmailUseCase";
import { EliminarCuentaUseCase } from "../../../application/use-cases/EliminarCuentaUseCase";
import { VerificarIdentidadUseCase } from "../../../application/use-cases/VerificarIdentidadUseCase";
import { IniciarSesionWebUseCase } from "../../../application/use-cases/IniciarSesionWebUseCase";

// DTOs (Tuyos)
import { RegistrarPacienteDto } from "../../../application/dtos/RegistrarPacienteDto";
import { RegistrarDoctorDto } from "../../../application/dtos/RegistrarDoctorDto";
import { LoginDto } from "../../../application/dtos/LoginDto";
import { CambiarEmailDto } from "../../../application/dtos/CambiarEmailDto";
import { EliminarCuentaDto } from "../../../application/dtos/EliminarCuentaDto";

// Repositories (para el endpoint me)
import { IUsuarioRepository } from "../../../domain/repositories/IUsuarioRepository";

// Errores y Servicios
import { RedisNoDisponibleError } from "../../../infrastructure/external-services/RedisCacheService";

/** Recorre recursivamente ValidationError y devuelve todos los mensajes */
function flattenValidationErrors(
  errors: ValidationError[],
  prefix = "",
): string[] {
  const messages: string[] = [];
  for (const e of errors) {
    const path = prefix ? `${prefix}.${e.property}` : e.property;
    if (e.constraints) {
      messages.push(
        ...Object.values(e.constraints).map((msg) =>
          path ? `${path}: ${msg}` : msg,
        ),
      );
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
          message: "Token de registro no proporcionado.",
        });
        return;
      }

      const files = (req.files as Record<string, Express.Multer.File[]>) ?? {};

      const dto = plainToInstance(RegistrarPacienteDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const messages = flattenValidationErrors(errors);
        res.status(400).json({
          success: false,
          message: "Validación fallida",
          errors: messages.join("; "),
        });
        return;
      }

      const useCase = container.resolve(RegistrarPacienteUseCase);
      await useCase.execute(dto, files, token);

      res.status(201).json({
        success: true,
        message: "Paciente registrado exitosamente",
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
        res
          .status(401)
          .json({
            success: false,
            message: "Token de registro no proporcionado.",
          });
        return;
      }

      if (!req.files || typeof req.files !== "object") {
        res
          .status(400)
          .json({ success: false, message: "No se proporcionaron archivos" });
        return;
      }

      const files = req.files as Record<string, Express.Multer.File[]>;

      // Límites de archivos
      const MAX_FOTO_DOCUMENTO = 2;
      const MAX_TITULO_ACADEMICO = 10;

      // Validar fotoPerfil (opcional, máximo 1)
      if (files.fotoPerfil && files.fotoPerfil.length > 1) {
        res.status(400).json({
          success: false,
          message: "Solo puedes subir 1 foto de perfil",
        });
        return;
      }

      // Validar fotoDocumento (1-2 archivos)
      if (!files.fotoDocumento || files.fotoDocumento.length === 0) {
        res.status(400).json({
          success: false,
          message: "Al menos una foto de documento es requerida",
        });
        return;
      }

      if (files.fotoDocumento.length > MAX_FOTO_DOCUMENTO) {
        res.status(400).json({
          success: false,
          message: `Has subido ${files.fotoDocumento.length} fotos de documento. El máximo permitido es ${MAX_FOTO_DOCUMENTO}. Por favor, selecciona solo las más importantes.`,
        });
        return;
      }

      // Validar tituloAcademico (1-10 archivos)
      if (!files.tituloAcademico || files.tituloAcademico.length === 0) {
        res.status(400).json({
          success: false,
          message: "Al menos un título académico es requerido",
        });
        return;
      }

      if (files.tituloAcademico.length > MAX_TITULO_ACADEMICO) {
        res.status(400).json({
          success: false,
          message: `Has subido ${files.tituloAcademico.length} títulos académicos. El máximo permitido es ${MAX_TITULO_ACADEMICO}. Por favor, selecciona solo los más relevantes.`,
        });
        return;
      }

      // Certificaciones son opcionales

      const dto = plainToInstance(RegistrarDoctorDto, req.body, {
        enableImplicitConversion: true,
        excludeExtraneousValues: false,
      });
      const errors = await validate(dto, { forbidNonWhitelisted: false });

      if (errors.length > 0) {
        const messages = flattenValidationErrors(errors);
        res.status(400).json({
          success: false,
          message: "Validación fallida",
          errors: messages.join("; "),
        });
        return;
      }

      const useCase = container.resolve(RegistrarDoctorUseCase);
      await useCase.execute(dto, files, token);

      res.status(201).json({
        success: true,
        message:
          "Doctor registrado exitosamente. Su solicitud está en revisión.",
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
        res
          .status(400)
          .json({
            success: false,
            message: "El correo electrónico es requerido.",
          });
        return;
      }

      const useCase = container.resolve(SolicitarCodigoRegistroUseCase);
      await useCase.execute(email);

      res
        .status(200)
        .json({
          success: true,
          message: "Código de registro enviado al correo electrónico.",
        });
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
        res
          .status(400)
          .json({ success: false, message: "Email y código son requeridos." });
        return;
      }

      const useCase = container.resolve(ValidarCodigoRegistroUseCase);
      const token = await useCase.execute(email, codigo);

      res.status(200).json({
        success: true,
        message: "Código validado correctamente.",
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
          message: "Datos de login inválidos",
          errors: flattenValidationErrors(errors),
        });
        return;
      }

      const loginUseCase = container.resolve(LoginUseCase);
      const result = await loginUseCase.execute(dto);

      res.status(200).json({
        success: true,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        usuario: result.usuario,
      });
    } catch (error) {
      this.manejarError(error, res);
    }
  }

  /**
   * POST /auth/google
   * Actualizado: devuelve token de registro para que el usuario elija su tipo
   */
  async loginGoogle(req: Request, res: Response): Promise<void> {
    try {
      const idToken = req.body?.idToken ?? req.body?.id_token;
      if (!idToken || typeof idToken !== "string") {
        res
          .status(400)
          .json({ success: false, message: "Se requiere idToken de Google." });
        return;
      }

      const loginGoogleUseCase = container.resolve(LoginGoogleUseCase);
      const result = await loginGoogleUseCase.execute(idToken);

      // Si es login (usuario existente)
      if (result.estado === "login") {
        res.status(200).json({
          success: true,
          estado: "login",
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          usuario: result.user,
        });
        return;
      }

      // Si es registro (usuario nuevo) - devolver token de registro + email
      res.status(200).json({
        success: true,
        estado: "registro",
        message:
          "Por favor completa tu registro seleccionando tu tipo de usuario",
        registroToken: result.registroToken,
        email: result.email,
      });
    } catch (error) {
      this.manejarError(error, res);
    }
  }

  /**
   * POST /auth/google/attach-password
   * Body: { idToken: string, password: string }
   * Verifica el id_token de Google y establece una contraseña local para la cuenta asociada.
   */
  async attachPasswordGoogle(req: Request, res: Response): Promise<void> {
    try {
      const { idToken, password } = req.body as {
        idToken?: string;
        password?: string;
      };
      if (!idToken || !password) {
        res
          .status(400)
          .json({
            success: false,
            message: "idToken y password son requeridos.",
          });
        return;
      }

      const useCase = container.resolve(AttachPasswordToGoogleAccountUseCase);
      await useCase.execute(idToken, password);

      res
        .status(200)
        .json({
          success: true,
          message:
            "Contraseña asociada correctamente. Ya puedes iniciar sesión con email y contraseña.",
        });
    } catch (error) {
      this.manejarError(error, res);
    }
  }

  /**
   * POST /auth/refresh
   * Recibe un refreshToken y devuelve un nuevo par de tokens
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken?: string };
      if (!refreshToken) {
        res
          .status(400)
          .json({ success: false, message: "refreshToken es requerido." });
        return;
      }

      const useCase = container.resolve(RefreshTokenUseCase);
      const tokens = await useCase.execute(refreshToken);

      res.status(200).json({
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
      this.manejarError(error, res);
    }
  }

  /**
   * POST /auth/password/solicitar-codigo
   * Enviar código de recuperación al correo
   */
  async solicitarCodigoRecuperacion(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { email } = req.body as { email?: string };
      if (!email) {
        res
          .status(400)
          .json({
            success: false,
            message: "El correo electrónico es requerido.",
          });
        return;
      }

      const useCase = container.resolve(SolicitarRecuperacionPasswordUseCase);
      await useCase.execute(email);

      res.status(200).json({
        success: true,
        message:
          "Se ha enviado un código de recuperación al correo electrónico.",
      });
    } catch (error) {
      this.manejarError(error, res);
    }
  }

  /**
   * POST /auth/password/validar-codigo
   * Valida el código enviado por correo y devuelve un token para cambio de contraseña
   */
  async validarCodigoRecuperacion(req: Request, res: Response): Promise<void> {
    try {
      const { email, codigo } = req.body as { email?: string; codigo?: string };
      if (!email || !codigo) {
        res
          .status(400)
          .json({ success: false, message: "Email y código son requeridos." });
        return;
      }

      const useCase = container.resolve(
        ValidarCodigoRecuperacionPasswordUseCase,
      );
      const token = await useCase.execute(email, codigo);

      res.status(200).json({
        success: true,
        message: "Código validado correctamente.",
        data: { token },
      });
    } catch (error) {
      this.manejarError(error, res);
    }
  }

  /**
   * POST /auth/password/cambiar
   * Cambia la contraseña usando el token de recuperación
   */
  async cambiarPasswordConToken(req: Request, res: Response): Promise<void> {
    try {
      const token = this.extraerTokenRecuperacion(req);
      const { nuevaPassword, confirmarPassword } = req.body as {
        nuevaPassword?: string;
        confirmarPassword?: string;
      };

      if (!token || !nuevaPassword || !confirmarPassword) {
        res.status(400).json({
          success: false,
          message:
            "Header X-Recovery-Token, nueva contraseña y confirmación son requeridos.",
        });
        return;
      }

      const useCase = container.resolve(CambiarPasswordConTokenUseCase);
      await useCase.execute(token, nuevaPassword, confirmarPassword);

      res.status(200).json({
        success: true,
        message: "Contraseña actualizada correctamente.",
      });
    } catch (error) {
      this.manejarError(error, res);
    }
  }

  /**
   * PATCH /auth/password/cambiar-autenticado
   * Cambia la contraseña del usuario ya autenticado (JWT).
   * Requiere: Bearer token válido + contraseña actual + nueva contraseña.
   * Ideal para el flujo de Configuración de perfil.
   */
  async cambiarPasswordAutenticado(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = (req as any).user?.userId;
      if (!usuarioId) {
        res
          .status(401)
          .json({
            success: false,
            message: "No autorizado. Debe iniciar sesión.",
          });
        return;
      }

      const { passwordActual, nuevaPassword, confirmarPassword } = req.body as {
        passwordActual?: string;
        nuevaPassword?: string;
        confirmarPassword?: string;
      };

      if (!passwordActual || !nuevaPassword || !confirmarPassword) {
        res.status(400).json({
          success: false,
          message:
            "Se requieren: passwordActual, nuevaPassword y confirmarPassword.",
        });
        return;
      }

      const useCase = container.resolve(CambiarPasswordAutenticadoUseCase);
      await useCase.execute(
        usuarioId,
        passwordActual,
        nuevaPassword,
        confirmarPassword,
      );

      res
        .status(200)
        .json({
          success: true,
          message: "Contraseña actualizada correctamente.",
        });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("actual es incorrecta")) {
          res.status(401).json({ success: false, message: error.message });
          return;
        }
        if (
          error.message.includes("no coinciden") ||
          error.message.includes("igual a la contraseña actual") ||
          error.message.includes("contraseña local") ||
          error.message.includes("política")
        ) {
          res.status(400).json({ success: false, message: error.message });
          return;
        }
      }
      this.manejarError(error, res);
    }
  }

  /**
   * POST /auth/refresh-access-token
   * Recibe un refreshToken y devuelve un nuevo accessToken
   *
   * Body:
   * {
   *   "refreshToken": "eyJhbGc..."
   * }
   */
  async refreshAccessToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken?: string };

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: "El refreshToken es requerido.",
        });
        return;
      }

      const useCase = container.resolve(RefreshAccessTokenUseCase);
      const tokens = await useCase.execute(refreshToken);

      res.status(200).json({
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
      this.manejarError(error, res);
    }
  }

  /**
   * PATCH /auth/foto-perfil
   * Actualiza la foto de perfil del usuario autenticado
   */
  async actualizarFotoPerfil(req: Request, res: Response): Promise<void> {
    try {
      // Verificar autenticación
      const usuarioId = (req as any).user?.userId;
      if (!usuarioId) {
        res.status(401).json({
          success: false,
          message: "No autorizado. Debe iniciar sesión.",
        });
        return;
      }

      // Verificar que se envió un archivo
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "Debe proporcionar una foto de perfil",
        });
        return;
      }

      // Validar tipo de archivo
      const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedMimes.includes(req.file.mimetype)) {
        res.status(400).json({
          success: false,
          message: "Solo se permiten imágenes (JPEG, PNG, WEBP)",
        });
        return;
      }

      // Validar tamaño (5MB máximo)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        res.status(400).json({
          success: false,
          message: "La imagen no puede exceder 5MB",
        });
        return;
      }

      const useCase = container.resolve(ActualizarFotoPerfilUseCase);
      const result = await useCase.execute(usuarioId, req.file);

      res.status(200).json({
        success: true,
        message: "Foto de perfil actualizada exitosamente",
        data: result,
      });
    } catch (error) {
      this.manejarError(error, res);
    }
  }

  /**
   * GET /auth/verificar-documento
   * Verifica si un número de documento ya está registrado
   */
  /**
   * PATCH /auth/banner
   * Actualiza el banner del usuario autenticado
   */
  async actualizarBanner(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = (req as any).user?.userId;
      if (!usuarioId) {
        res
          .status(401)
          .json({
            success: false,
            message: "No autorizado. Debe iniciar sesión.",
          });
        return;
      }
      if (!req.file) {
        res
          .status(400)
          .json({
            success: false,
            message: "Debe proporcionar una imagen de banner",
          });
        return;
      }
      const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedMimes.includes(req.file.mimetype)) {
        res
          .status(400)
          .json({
            success: false,
            message: "Solo se permiten imágenes (JPEG, PNG, WEBP)",
          });
        return;
      }
      const maxSize = 5 * 1024 * 1024;
      if (req.file.size > maxSize) {
        res
          .status(400)
          .json({ success: false, message: "La imagen no puede exceder 5MB" });
        return;
      }
      const useCase = container.resolve(ActualizarBannerUseCase);
      const result = await useCase.execute(usuarioId, req.file);
      res
        .status(200)
        .json({
          success: true,
          message: "Banner actualizado exitosamente",
          data: result,
        });
    } catch (error) {
      this.manejarError(error, res);
    }
  }

  async verificarDocumento(req: Request, res: Response): Promise<void> {
    try {
      const { numero } = req.query;

      if (!numero || typeof numero !== "string") {
        res.status(400).json({
          success: false,
          message: "El número de documento es requerido",
        });
        return;
      }

      const useCase = container.resolve<VerificarDocumentoUseCase>(
        "VerificarDocumentoUseCase" as any,
      );
      const resultado = await useCase.execute(numero);

      if (resultado.disponible) {
        res.status(200).json({
          success: true,
          disponible: true,
          message: "El número de documento está disponible",
        });
      } else {
        res.status(200).json({
          success: true,
          disponible: false,
          message: "Este número de documento ya está registrado",
          tipoUsuario: resultado.tipoUsuario,
          estado: resultado.estado,
        });
      }
    } catch (error) {
      this.manejarError(error, res);
    }
  }

  // ===========================================================================
  // HELPERS PRIVADOS
  // ===========================================================================

  /**
   * POST /auth/verificar-identidad
   * Verifica la contraseña del usuario autenticado (prueba de identidad).
   * Requiere JWT válido en Authorization header.
   * Body: { password: string }
   */
  async verificarIdentidad(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = (req as any).user?.userId;
      if (!usuarioId) {
        res.status(401).json({ success: false, message: "No autorizado." });
        return;
      }

      const { password } = req.body as { password?: string };
      if (!password) {
        res
          .status(400)
          .json({ success: false, message: "La contraseña es requerida." });
        return;
      }

      const useCase = container.resolve(VerificarIdentidadUseCase);
      await useCase.execute(usuarioId, password);

      res.status(200).json({ success: true, verificado: true });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Credenciales inválidas."
      ) {
        res
          .status(401)
          .json({ success: false, message: "Credenciales inválidas." });
        return;
      }
      if (
        error instanceof Error &&
        error.message.includes("contraseña local")
      ) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      this.manejarError(error, res);
    }
  }

  private extraerToken(req: Request): string | null {
    // Intentar obtener el header preservado primero (middleware preserveAuthHeaders)
    let authHeader =
      (req as any).originalAuthorization ||
      req.headers.authorization ||
      req.headers.Authorization;

    // Si no viene en los headers estándar, intentar con diferentes casos
    if (!authHeader) {
      // Intentar con headers en minúsculas (algunos clientes los envían así)
      authHeader =
        (req.headers as any)["authorization"] ??
        (req.headers as any)["Authorization"] ??
        req.headers["x-authorization"] ??
        req.headers["X-Authorization"];
    }

    if (typeof authHeader === "string") {
      const trimmedHeader = authHeader.trim();

      // Para endpoints de registro, aceptar token puro sin "Bearer"
      if (trimmedHeader.startsWith("Bearer ")) {
        return trimmedHeader.substring(7).trim();
      }
      // Para registro, aceptar token puro
      return trimmedHeader;
    }

    return null;
  }

  private extraerTokenRecuperacion(req: Request): string | null {
    const recoveryHeader =
      req.headers["x-recovery-token"] ?? req.headers["X-Recovery-Token"];
    if (typeof recoveryHeader === "string") {
      return recoveryHeader.trim();
    }
    return null;
  }

  private manejarError(error: unknown, res: Response): void {
    console.error("Error Auth:", error);

    if (error instanceof RedisNoDisponibleError) {
      res
        .status(503)
        .json({
          success: false,
          message: "Servicio de validación no disponible.",
        });
      return;
    }

    // Manejo en línea de errores de Prisma (sin utilidades externas)
    const e: any = error as any;
    if (e && typeof e === "object") {
      if (e.code === "P2002") {
        const target = e.meta?.target;
        const fields = Array.isArray(target) ? target.join(", ") : target;
        res
          .status(409)
          .json({
            success: false,
            message: `Valor duplicado en campo(s): ${fields}`,
          });
        return;
      }
      if (e.code === "P2025") {
        res
          .status(404)
          .json({ success: false, message: "Registro no encontrado" });
        return;
      }
    }

    if (error instanceof Error) {
      const msg = error.message;
      if (msg === "Credenciales inválidas") {
        res.status(401).json({ success: false, message: msg });
        return;
      }
      if (msg.includes("Token")) {
        res
          .status(401)
          .json({ success: false, message: "Token inválido o expirado" });
        return;
      }
      res.status(400).json({ success: false, message: msg });
      return;
    }

    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor." });
  }

  /**
   * PATCH /auth/cambiar-email
   * Permite al usuario cambiar su dirección de email
   */
  async cambiarEmail(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = req.user!.userId; // Del middleware JWT
      const dto = Object.assign(
        new CambiarEmailDto(req.body.nuevoEmail, req.body.password),
        req.body,
      );
      const errors = await validate(dto);

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: "Validación fallida",
          errors: flattenValidationErrors(errors),
        });
        return;
      }

      const useCase = container.resolve(CambiarEmailUseCase);
      await useCase.execute(usuarioId, dto);

      res.status(200).json({
        success: true,
        message: "Email actualizado exitosamente",
      });
    } catch (error: any) {
      console.error("Error en cambiarEmail:", error);

      // Manejo de errores específicos
      if (error.message.includes("Contraseña incorrecta")) {
        res.status(401).json({ success: false, message: error.message });
        return;
      }
      if (error.message.includes("ya está registrado")) {
        res.status(409).json({ success: false, message: error.message });
        return;
      }
      if (error.message.includes("establecer una contraseña")) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || "Error al cambiar el email",
      });
    }
  }

  /**
   * DELETE /auth/cuenta
   * Elimina (soft delete) la cuenta del usuario autenticado
   */
  async eliminarCuenta(req: Request, res: Response): Promise<void> {
    try {
      // 1. Verificar autenticación
      const usuarioId = (req as any).usuarioId;
      if (!usuarioId) {
        res.status(401).json({ error: "No autenticado" });
        return;
      }

      // 2. Validar body
      if (!req.body || !req.body.password || !req.body.confirmacion) {
        res.status(400).json({
          error: "Datos incompletos",
          detalles: "Se requiere password y confirmación",
        });
        return;
      }

      // 3. Crear y validar DTO
      const dto = plainToInstance(EliminarCuentaDto, {
        password: req.body.password,
        confirmacion: req.body.confirmacion,
      });

      const errores = await validate(dto);
      if (errores.length > 0) {
        const mensajes = flattenValidationErrors(errores);
        res.status(400).json({
          error: "Validación fallida",
          detalles: mensajes,
        });
        return;
      }

      // 4. Ejecutar use case
      const useCase = container.resolve(EliminarCuentaUseCase);
      await useCase.execute(usuarioId, dto);

      // 5. Respuesta exitosa
      res.status(200).json({
        mensaje: "Cuenta eliminada exitosamente",
        nota: "Puedes volver a registrarte con el mismo email si lo deseas",
      });
    } catch (error: any) {
      this.manejarError(error, res);
    }
  }

  public iniciarSesionWeb = async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      const iniciarSesionWebUseCase = new IniciarSesionWebUseCase();
      const resultado = await iniciarSesionWebUseCase.execute(token);

      return res.status(200).json({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error(error);
      if (error.message.includes("UNAUTHORIZED")) {
        return res.status(401).json({
          success: false,
          error: error.message.replace("UNAUTHORIZED: ", ""),
        });
      }
      return res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  };
}
