import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../database/prisma/client';

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
 * Valida que el usuario esté activo (no eliminado)
 */
export const autenticarJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    // Verificar que el usuario existe y está activo
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
      select: { id: true, estado: true, rol: true },
    });

    if (!usuario) {
      res.status(401).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Validar que el usuario esté activo
    if (usuario.estado !== 'Activo') {
      res.status(403).json({
        error: 'Cuenta inactiva',
        mensaje: 'Tu cuenta ha sido eliminada o desactivada. Si deseas volver a usar nuestros servicios, puedes registrarte nuevamente con el mismo email.',
      });
      return;
    }

    // Agregar la información del usuario al objeto request
    req.user = decoded;
    (req as any).usuarioId = decoded.userId;
    (req as any).rol = usuario.rol;

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
