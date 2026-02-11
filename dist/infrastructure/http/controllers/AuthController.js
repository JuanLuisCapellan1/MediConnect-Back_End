"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const tsyringe_1 = require("tsyringe");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
// Use Cases (Tuyos - Clean Architecture)
const RegistrarPacienteUseCase_1 = require("../../../application/use-cases/RegistrarPacienteUseCase");
const RegistrarDoctorUseCase_1 = require("../../../application/use-cases/RegistrarDoctorUseCase");
const SolicitarCodigoRegistroUseCase_1 = require("../../../application/use-cases/SolicitarCodigoRegistroUseCase");
const ValidarCodigoRegistroUseCase_1 = require("../../../application/use-cases/ValidarCodigoRegistroUseCase");
const LoginGoogleUseCase_1 = require("../../../application/use-cases/LoginGoogleUseCase");
const LoginUseCase_1 = require("../../../application/use-cases/LoginUseCase");
const RefreshTokenUseCase_1 = require("../../../application/use-cases/RefreshTokenUseCase");
const SolicitarRecuperacionPasswordUseCase_1 = require("../../../application/use-cases/SolicitarRecuperacionPasswordUseCase");
const ValidarCodigoRecuperacionPasswordUseCase_1 = require("../../../application/use-cases/ValidarCodigoRecuperacionPasswordUseCase");
const CambiarPasswordConTokenUseCase_1 = require("../../../application/use-cases/CambiarPasswordConTokenUseCase");
const RefreshAccessTokenUseCase_1 = require("../../../application/use-cases/RefreshAccessTokenUseCase");
const AttachPasswordToGoogleAccountUseCase_1 = require("../../../application/use-cases/AttachPasswordToGoogleAccountUseCase");
const ActualizarFotoPerfilUseCase_1 = require("../../../application/use-cases/ActualizarFotoPerfilUseCase");
// DTOs (Tuyos)
const RegistrarPacienteDto_1 = require("../../../application/dtos/RegistrarPacienteDto");
const RegistrarDoctorDto_1 = require("../../../application/dtos/RegistrarDoctorDto");
const LoginDto_1 = require("../../../application/dtos/LoginDto");
// Errores y Servicios
const RedisCacheService_1 = require("../../../infrastructure/external-services/RedisCacheService");
/** Recorre recursivamente ValidationError y devuelve todos los mensajes */
function flattenValidationErrors(errors, prefix = '') {
    const messages = [];
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
class AuthController {
    // ===========================================================================
    // MÉTODOS DE PRODUCCIÓN (Clean Architecture - TUS CAMBIOS)
    // ===========================================================================
    /**
     * POST /auth/registro/paciente
     */
    async completarRegistroPaciente(req, res) {
        try {
            const token = this.extraerToken(req);
            if (!token) {
                res.status(401).json({
                    success: false,
                    message: 'Token de registro no proporcionado.',
                });
                return;
            }
            const files = req.files ?? {};
            const dto = (0, class_transformer_1.plainToInstance)(RegistrarPacienteDto_1.RegistrarPacienteDto, req.body);
            const errors = await (0, class_validator_1.validate)(dto);
            if (errors.length > 0) {
                const messages = flattenValidationErrors(errors);
                res.status(400).json({
                    success: false,
                    message: 'Validación fallida',
                    errors: messages.join('; '),
                });
                return;
            }
            const useCase = tsyringe_1.container.resolve(RegistrarPacienteUseCase_1.RegistrarPacienteUseCase);
            await useCase.execute(dto, files, token);
            res.status(201).json({
                success: true,
                message: 'Paciente registrado exitosamente',
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * POST /auth/registro/doctor
     */
    async completarRegistroDoctor(req, res) {
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
            const files = req.files;
            const archivosRequeridos = ['fotoPerfil', 'fotoDocumento', 'tituloAcademico', 'certificaciones'];
            for (const archivo of archivosRequeridos) {
                if (!files[archivo] || !files[archivo][0]) {
                    res.status(400).json({ success: false, message: `${archivo} es requerido` });
                    return;
                }
            }
            const dto = (0, class_transformer_1.plainToInstance)(RegistrarDoctorDto_1.RegistrarDoctorDto, req.body, {
                enableImplicitConversion: true,
                excludeExtraneousValues: false,
            });
            const errors = await (0, class_validator_1.validate)(dto, { forbidNonWhitelisted: false });
            if (errors.length > 0) {
                const messages = flattenValidationErrors(errors);
                res.status(400).json({
                    success: false,
                    message: 'Validación fallida',
                    errors: messages.join('; '),
                });
                return;
            }
            const useCase = tsyringe_1.container.resolve(RegistrarDoctorUseCase_1.RegistrarDoctorUseCase);
            await useCase.execute(dto, files, token);
            res.status(201).json({
                success: true,
                message: 'Doctor registrado exitosamente. Su solicitud está en revisión.',
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * POST /auth/registro/solicitar-codigo
     */
    async solicitarCodigo(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ success: false, message: 'El correo electrónico es requerido.' });
                return;
            }
            const useCase = tsyringe_1.container.resolve(SolicitarCodigoRegistroUseCase_1.SolicitarCodigoRegistroUseCase);
            await useCase.execute(email);
            res.status(200).json({ success: true, message: 'Código de registro enviado al correo electrónico.' });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * POST /auth/registro/validar-codigo
     */
    async validarCodigo(req, res) {
        try {
            const { email, codigo } = req.body;
            if (!email || !codigo) {
                res.status(400).json({ success: false, message: 'Email y código son requeridos.' });
                return;
            }
            const useCase = tsyringe_1.container.resolve(ValidarCodigoRegistroUseCase_1.ValidarCodigoRegistroUseCase);
            const token = await useCase.execute(email, codigo);
            res.status(200).json({
                success: true,
                message: 'Código validado correctamente.',
                data: { token },
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * POST /auth/login
     * Login oficial usando Casos de Uso
     */
    async login(req, res) {
        try {
            const dto = (0, class_transformer_1.plainToInstance)(LoginDto_1.LoginDto, req.body);
            const errors = await (0, class_validator_1.validate)(dto);
            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Datos de login inválidos',
                    errors: flattenValidationErrors(errors),
                });
                return;
            }
            const loginUseCase = tsyringe_1.container.resolve(LoginUseCase_1.LoginUseCase);
            const result = await loginUseCase.execute(dto);
            res.status(200).json({
                success: true,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                usuario: result.usuario,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * POST /auth/google
     * Actualizado: devuelve token de registro para que el usuario elija su tipo
     */
    async loginGoogle(req, res) {
        try {
            const idToken = req.body?.idToken ?? req.body?.id_token;
            if (!idToken || typeof idToken !== 'string') {
                res.status(400).json({ success: false, message: 'Se requiere idToken de Google.' });
                return;
            }
            const loginGoogleUseCase = tsyringe_1.container.resolve(LoginGoogleUseCase_1.LoginGoogleUseCase);
            const result = await loginGoogleUseCase.execute(idToken);
            // Si es login (usuario existente)
            if (result.estado === 'login') {
                res.status(200).json({
                    success: true,
                    estado: 'login',
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                    usuario: result.user,
                });
                return;
            }
            // Si es registro (usuario nuevo) - devolver token de registro + email
            res.status(200).json({
                success: true,
                estado: 'registro',
                message: 'Por favor completa tu registro seleccionando tu tipo de usuario',
                registroToken: result.registroToken,
                email: result.email,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * POST /auth/google/attach-password
     * Body: { idToken: string, password: string }
     * Verifica el id_token de Google y establece una contraseña local para la cuenta asociada.
     */
    async attachPasswordGoogle(req, res) {
        try {
            const { idToken, password } = req.body;
            if (!idToken || !password) {
                res.status(400).json({ success: false, message: 'idToken y password son requeridos.' });
                return;
            }
            const useCase = tsyringe_1.container.resolve(AttachPasswordToGoogleAccountUseCase_1.AttachPasswordToGoogleAccountUseCase);
            await useCase.execute(idToken, password);
            res.status(200).json({ success: true, message: 'Contraseña asociada correctamente. Ya puedes iniciar sesión con email y contraseña.' });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * POST /auth/refresh
     * Recibe un refreshToken y devuelve un nuevo par de tokens
     */
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(400).json({ success: false, message: 'refreshToken es requerido.' });
                return;
            }
            const useCase = tsyringe_1.container.resolve(RefreshTokenUseCase_1.RefreshTokenUseCase);
            const tokens = await useCase.execute(refreshToken);
            res.status(200).json({
                success: true,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * POST /auth/password/solicitar-codigo
     * Enviar código de recuperación al correo
     */
    async solicitarCodigoRecuperacion(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ success: false, message: 'El correo electrónico es requerido.' });
                return;
            }
            const useCase = tsyringe_1.container.resolve(SolicitarRecuperacionPasswordUseCase_1.SolicitarRecuperacionPasswordUseCase);
            await useCase.execute(email);
            res.status(200).json({
                success: true,
                message: 'Se ha enviado un código de recuperación al correo electrónico.',
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * POST /auth/password/validar-codigo
     * Valida el código enviado por correo y devuelve un token para cambio de contraseña
     */
    async validarCodigoRecuperacion(req, res) {
        try {
            const { email, codigo } = req.body;
            if (!email || !codigo) {
                res.status(400).json({ success: false, message: 'Email y código son requeridos.' });
                return;
            }
            const useCase = tsyringe_1.container.resolve(ValidarCodigoRecuperacionPasswordUseCase_1.ValidarCodigoRecuperacionPasswordUseCase);
            const token = await useCase.execute(email, codigo);
            res.status(200).json({
                success: true,
                message: 'Código validado correctamente.',
                data: { token },
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * POST /auth/password/cambiar
     * Cambia la contraseña usando el token de recuperación
     */
    async cambiarPasswordConToken(req, res) {
        try {
            const token = this.extraerTokenRecuperacion(req);
            const { nuevaPassword, confirmarPassword } = req.body;
            if (!token || !nuevaPassword || !confirmarPassword) {
                res.status(400).json({
                    success: false,
                    message: 'Header X-Recovery-Token, nueva contraseña y confirmación son requeridos.',
                });
                return;
            }
            const useCase = tsyringe_1.container.resolve(CambiarPasswordConTokenUseCase_1.CambiarPasswordConTokenUseCase);
            await useCase.execute(token, nuevaPassword, confirmarPassword);
            res.status(200).json({
                success: true,
                message: 'Contraseña actualizada correctamente.',
            });
        }
        catch (error) {
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
    async refreshAccessToken(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(400).json({
                    success: false,
                    message: 'El refreshToken es requerido.',
                });
                return;
            }
            const useCase = tsyringe_1.container.resolve(RefreshAccessTokenUseCase_1.RefreshAccessTokenUseCase);
            const tokens = await useCase.execute(refreshToken);
            res.status(200).json({
                success: true,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * PATCH /auth/foto-perfil
     * Actualiza la foto de perfil del usuario autenticado
     */
    async actualizarFotoPerfil(req, res) {
        try {
            // Verificar autenticación
            const usuarioId = req.usuarioId;
            if (!usuarioId) {
                res.status(401).json({
                    success: false,
                    message: 'No autorizado. Debe iniciar sesión.',
                });
                return;
            }
            // Verificar que se envió un archivo
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: 'Debe proporcionar una foto de perfil',
                });
                return;
            }
            // Validar tipo de archivo
            const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedMimes.includes(req.file.mimetype)) {
                res.status(400).json({
                    success: false,
                    message: 'Solo se permiten imágenes (JPEG, PNG, WEBP)',
                });
                return;
            }
            // Validar tamaño (5MB máximo)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (req.file.size > maxSize) {
                res.status(400).json({
                    success: false,
                    message: 'La imagen no puede exceder 5MB',
                });
                return;
            }
            const useCase = tsyringe_1.container.resolve(ActualizarFotoPerfilUseCase_1.ActualizarFotoPerfilUseCase);
            const result = await useCase.execute(usuarioId, req.file);
            res.status(200).json({
                success: true,
                message: 'Foto de perfil actualizada exitosamente',
                data: result,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // ===========================================================================
    // HELPERS PRIVADOS
    // ===========================================================================
    extraerToken(req) {
        // Intentar obtener el header preservado primero (middleware preserveAuthHeaders)
        let authHeader = req.originalAuthorization ||
            req.headers.authorization ||
            req.headers.Authorization;
        // Si no viene en los headers estándar, intentar con diferentes casos
        if (!authHeader) {
            // Intentar con headers en minúsculas (algunos clientes los envían así)
            authHeader = req.headers['authorization'] ??
                req.headers['Authorization'] ??
                req.headers['x-authorization'] ??
                req.headers['X-Authorization'];
        }
        if (typeof authHeader === 'string') {
            const trimmedHeader = authHeader.trim();
            // Para endpoints de registro, aceptar token puro sin "Bearer"
            if (trimmedHeader.startsWith('Bearer ')) {
                return trimmedHeader.substring(7).trim();
            }
            // Para registro, aceptar token puro
            return trimmedHeader;
        }
        return null;
    }
    extraerTokenRecuperacion(req) {
        const recoveryHeader = req.headers['x-recovery-token'] ?? req.headers['X-Recovery-Token'];
        if (typeof recoveryHeader === 'string') {
            return recoveryHeader.trim();
        }
        return null;
    }
    manejarError(error, res) {
        console.error('Error Auth:', error);
        if (error instanceof RedisCacheService_1.RedisNoDisponibleError) {
            res.status(503).json({ success: false, message: 'Servicio de validación no disponible.' });
            return;
        }
        // Manejo en línea de errores de Prisma (sin utilidades externas)
        const e = error;
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
exports.AuthController = AuthController;
