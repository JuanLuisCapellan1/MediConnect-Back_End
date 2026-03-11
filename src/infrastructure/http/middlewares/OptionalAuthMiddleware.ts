import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TokenPayload } from './autenticacion';

/**
 * Middleware de autenticación opcional.
 * Si hay un token Bearer válido, adjunta req.user; si no, continúa sin error.
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next();
    }
    const token = authHeader.slice(7);
    try {
        const secret = process.env.JWT_SECRET ?? '';
        const payload = jwt.verify(token, secret) as TokenPayload;
        (req as any).user = payload;
    } catch {
        // Token inválido o expirado — continuar sin usuario
    }
    next();
};
