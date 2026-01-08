import { PrismaClient } from '@prisma/client';

// Declaración global para evitar múltiples instancias en desarrollo (Hot Reload)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // Opcional: ver logs en consola
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;