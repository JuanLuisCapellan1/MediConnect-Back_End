"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificarRol = exports.autenticarJWTOpcional = exports.autenticarJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Middleware para verificar el token JWT en las peticiones HTTP
 */
const autenticarJWT = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ error: 'Token de autenticación requerido' });
            return;
        }
        // Extraer el token del header "Bearer TOKEN"
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : authHeader;
        const secreto = process.env.JWT_SECRET || 'secret-key-temporal';
        // Verificar y decodificar el token
        const decoded = jsonwebtoken_1.default.verify(token, secreto);
        // Asegurarnos de que sea un access token, no un refresh
        if (decoded.scope && decoded.scope !== 'access') {
            res.status(401).json({ error: 'Token de acceso inválido' });
            return;
        }
        // Agregar la información del usuario al objeto request
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error('Error al verificar token:', error);
        res.status(401).json({ error: 'Token inválido o expirado' });
        return;
    }
};
exports.autenticarJWT = autenticarJWT;
/**
 * Middleware opcional que intenta autenticar pero no bloquea si falla
 */
const autenticarJWTOpcional = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            next();
            return;
        }
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : authHeader;
        const secreto = process.env.JWT_SECRET || 'MediConnectSecretDefault2026';
        const decoded = jsonwebtoken_1.default.verify(token, secreto);
        // Manejar tanto tokens estándar como tokens de registro de Google
        req.usuarioId = decoded.userId || undefined;
        req.email = decoded.email;
        req.rol = decoded.rol || undefined;
        req.user = decoded; // Soporte para req.user también
        next(); // CRÍTICO: continuar con el siguiente middleware
    }
    catch (error) {
        // No bloquear, solo continuar sin usuario autenticado
        next();
    }
};
exports.autenticarJWTOpcional = autenticarJWTOpcional;
/**
 * Middleware para verificar roles específicos
 */
const verificarRol = (...rolesPermitidos) => {
    return (req, res, next) => {
        const rol = req.rol;
        if (!rol) {
            res.status(401).json({ error: 'Autenticación requerida' });
            return;
        }
        if (!rolesPermitidos.includes(rol)) {
            res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
            return;
        }
        next();
    };
};
exports.verificarRol = verificarRol;
