import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para verificar que el usuario tenga uno de los roles permitidos
 * @param roles - Array de roles permitidos (ej: ['Admin', 'Paciente'])
 */
export const requireRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado.',
            });
        }

        if (!roles.includes(user.rol)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para realizar esta acción.',
            });
        }

        next();
    };
};
