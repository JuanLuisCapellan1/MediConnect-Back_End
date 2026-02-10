import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: number;
  email: string;
  rol: string;
  scope?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware para verificar el token JWT en las peticiones HTTP
 */
export const autenticarJWT = (req: Request, res: Response, next: NextFunction): void => {
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
    const decoded = jwt.verify(token, secreto) as TokenPayload;

    // Asegurarnos de que sea un access token, no un refresh
    if (decoded.scope && decoded.scope !== 'access') {
      res.status(401).json({ error: 'Token de acceso inválido' });
      return;
    }

    // Agregar la información del usuario al objeto request
    (req as any).usuarioId = decoded.userId;
    (req as any).email = decoded.email;
    (req as any).rol = decoded.rol;
    req.user = decoded; // Soporte para req.user también

    next();
  } catch (error) {
    console.error('Error al verificar token:', error);
    res.status(401).json({ error: 'Token inválido o expirado' });
    return;
  }
};

/**
 * Middleware opcional que intenta autenticar pero no bloquea si falla
 */
export const autenticarJWTOpcional = (req: Request, res: Response, next: NextFunction): void => {
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
    const decoded = jwt.verify(token, secreto) as TokenPayload;

    // Manejar tanto tokens estándar como tokens de registro de Google
    (req as any).usuarioId = decoded.userId || undefined;
    (req as any).email = decoded.email;
    (req as any).rol = decoded.rol || undefined;
    req.user = decoded; // Soporte para req.user también
    next(); // CRÍTICO: continuar con el siguiente middleware
  } catch (error) {
    // No bloquear, solo continuar sin usuario autenticado
    next();
  }
};

/**
 * Middleware para verificar roles específicos
 */
export const verificarRol = (...rolesPermitidos: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const rol = (req as any).rol;

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
