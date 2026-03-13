"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Middleware de autenticación opcional.
 * Si hay un token Bearer válido, adjunta req.user; si no, continúa sin error.
 */
const optionalAuth = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next();
    }
    const token = authHeader.slice(7);
    try {
        const secret = process.env.JWT_SECRET ?? '';
        const payload = jsonwebtoken_1.default.verify(token, secret);
        req.user = payload;
    }
    catch {
        // Token inválido o expirado — continuar sin usuario
    }
    next();
};
exports.optionalAuth = optionalAuth;
