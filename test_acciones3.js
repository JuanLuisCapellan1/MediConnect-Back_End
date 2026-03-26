const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const acciones = await prisma.accion.findMany({
            orderBy: { id: 'desc' },
            take: 10,
            include: { tipoAccion: true, emisor: true }
        });
        console.log("=== ÚLTIMAS 10 ACCIONES ===");
        console.log(JSON.stringify(acciones, null, 2));
    } catch(e) {
        console.error("Error fetching acciones:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
