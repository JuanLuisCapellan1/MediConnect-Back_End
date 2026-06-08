"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IniciarSesionWebUseCase = void 0;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
class IniciarSesionWebUseCase {
    async execute(token) {
        if (!token) {
            throw new Error("Token es requerido");
        }
        // 1. Buscar la sesión por el token
        const session = await prisma.bot_sessions.findFirst({
            where: { web_token: token },
        });
        // 2. Validaciones
        if (!session) {
            throw new Error("UNAUTHORIZED: Link inválido");
        }
        if (session.web_token_expires && new Date() > session.web_token_expires) {
            throw new Error("UNAUTHORIZED: Link expirado");
        }
        if (!session.mediconnect_user_id) {
            throw new Error("UNAUTHORIZED: Sesión de bot sin usuario asociado");
        }
        // 3. Buscar al usuario asociado para generar un token válido con su Rol e ID
        const usuario = await prisma.usuario.findUnique({
            where: { id: session.mediconnect_user_id },
        });
        if (!usuario) {
            throw new Error("UNAUTHORIZED: Usuario no encontrado");
        }
        // 4. Invalidar el token para que sea de un solo uso
        await prisma.bot_sessions.update({
            where: { id: session.id },
            data: {
                web_token: null,
                web_token_expires: null,
            },
        });
        // 5. Generar un Access Token estándar de tu Backend
        const jwtSecret = process.env.JWT_SECRET || "MediConnectSecretKey";
        const accessToken = jsonwebtoken_1.default.sign({
            id: usuario.id,
            email: usuario.email,
        }, jwtSecret, { expiresIn: "24h" });
        return { accessToken };
    }
}
exports.IniciarSesionWebUseCase = IniciarSesionWebUseCase;
