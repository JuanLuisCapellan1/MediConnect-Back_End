"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
/**
 * Middleware para verificar que el usuario tenga uno de los roles permitidos
 * @param roles - Array de roles permitidos (ej: ['Admin', 'Paciente'])
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        const user = req.user;
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
exports.requireRole = requireRole;
