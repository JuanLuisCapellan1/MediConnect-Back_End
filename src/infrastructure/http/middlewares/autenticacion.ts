import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: number;
  email: string;
  rol: string;
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

    // Agregar la información del usuario al objeto request
    (req as any).usuarioId = decoded.userId;
    (req as any).email = decoded.email;
    (req as any).rol = decoded.rol;

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

    const secreto = process.env.JWT_SECRET || 'secret-key-temporal';
    const decoded = jwt.verify(token, secreto) as TokenPayload;

    (req as any).usuarioId = decoded.userId;
    (req as any).email = decoded.email;
    (req as any).rol = decoded.rol;

    next();
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
