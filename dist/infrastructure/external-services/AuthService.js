"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const tsyringe_1 = require("tsyringe");
let AuthService = class AuthService {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'default_secret';
    }
    getGoogleClient() {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            throw new Error('GOOGLE_CLIENT_ID no está configurado en el entorno.');
        }
        return new google_auth_library_1.OAuth2Client(clientId);
    }
    /**
     * Verifica el idToken de Google y devuelve email, googleId, nombre, apellido y foto.
     */
    async verificarGoogleToken(idToken) {
        const client = this.getGoogleClient();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email || !payload.sub) {
            throw new Error('Token de Google inválido: faltan email o sub.');
        }
        const nombre = payload.given_name ?? payload.name ?? '';
        const apellido = payload.family_name ?? '';
        const foto = payload.picture ?? '';
        return {
            email: payload.email,
            googleId: payload.sub,
            nombre,
            apellido,
            foto,
        };
    }
    /**
     * Genera un par de tokens (access + refresh) para sesión de usuario.
     * - accessToken: corto plazo (ej. 4h) para llamadas a la API
     * - refreshToken: más largo (ej. 3d) solo para renovar accessToken
     */
    generarTokensSesion(usuarioId, email, rol) {
        const accessToken = this.generarAccessToken(usuarioId, email, rol);
        const refreshToken = this.generarRefreshToken(usuarioId, email, rol);
        return { accessToken, refreshToken };
    }
    /**
     * Token de acceso de corta duración.
     * Por defecto 4h, configurable con ACCESS_TOKEN_EXPIRES_IN.
     */
    generarAccessToken(usuarioId, email, rol) {
        const payload = { userId: usuarioId, email, rol, scope: 'access' };
        const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || '4h';
        const options = { expiresIn: expiresIn };
        return jsonwebtoken_1.default.sign(payload, this.jwtSecret, options);
    }
    /**
     * Token de refresh de mayor duración.
     * Por defecto 3d, configurable con REFRESH_TOKEN_EXPIRES_IN.
     */
    generarRefreshToken(usuarioId, email, rol) {
        const payload = { userId: usuarioId, email, rol, scope: 'refresh' };
        const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '3d';
        const options = { expiresIn: expiresIn };
        return jsonwebtoken_1.default.sign(payload, this.jwtSecret, options);
    }
    /**
     * Verifica un refresh token y devuelve payload básico si es válido y de tipo refresh.
     */
    verificarRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.jwtSecret);
            if (decoded.scope !== 'refresh') {
                return null;
            }
            return { userId: decoded.userId, email: decoded.email, rol: decoded.rol };
        }
        catch {
            return null;
        }
    }
    generarTokenRegistro(email) {
        const payload = { email, scope: 'registro_completo' };
        const options = { expiresIn: '1h' }; // Token válido por 1 hora
        return jsonwebtoken_1.default.sign(payload, this.jwtSecret, options);
    }
    validateRegistrationToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.jwtSecret);
            if (decoded.scope === 'registro_completo') {
                return decoded.email;
            }
            return null;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Genera un token temporal para cambio de contraseña.
     */
    generarTokenRecuperacionPassword(email) {
        const payload = { email, scope: 'reset_password' };
        const options = { expiresIn: '30m' }; // 30 minutos por defecto
        return jsonwebtoken_1.default.sign(payload, this.jwtSecret, options);
    }
    validatePasswordResetToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.jwtSecret);
            if (decoded.scope === 'reset_password') {
                return decoded.email;
            }
            return null;
        }
        catch {
            return null;
        }
    }
    /**
     * Genera un token temporal para registro desde Google.
     * Incluye datos adicionales de Google (nombre, apellido, foto, googleId)
     * para que el usuario pueda elegir su tipo de registro.
     */
    generarTokenRegistroGoogle(email, googleId, nombre, apellido, foto) {
        const payload = {
            email,
            googleId,
            nombre,
            apellido,
            foto,
            scope: 'registro_google'
        };
        const options = { expiresIn: '1h' };
        return jsonwebtoken_1.default.sign(payload, this.jwtSecret, options);
    }
    /**
     * Valida un token de registro de Google
     */
    validateGoogleRegistrationToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.jwtSecret);
            if (decoded.scope === 'registro_google') {
                return {
                    email: decoded.email,
                    googleId: decoded.googleId,
                    nombre: decoded.nombre,
                    apellido: decoded.apellido,
                    foto: decoded.foto
                };
            }
            return null;
        }
        catch (error) {
            return null;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, tsyringe_1.injectable)()
], AuthService);
