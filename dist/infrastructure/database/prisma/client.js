"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Declaración global para evitar múltiples instancias en desarrollo (Hot Reload)
const globalForPrisma = global;
exports.prisma = globalForPrisma.prisma || new client_1.PrismaClient({
    log: ['query', 'info', 'warn', 'error'], // Opcional: ver logs en consola
});
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
