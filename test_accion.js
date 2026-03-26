const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const acciones = await prisma.accion.findMany({
        where: { tipoAccion: { nombre: 'Registro Doctor' } },
        orderBy: { id: 'desc' },
        take: 3,
        include: { emisor: true, tipoAccion: true }
    });
    console.log("=== ÚLTIMAS ACCIONES DE REGISTRO DOCTOR ===");
    console.log(JSON.stringify(acciones, null, 2));
    
    const doctores = await prisma.doctor.findMany({
        take: 3,
        orderBy: { creadoEn: 'desc' },
        select: { usuarioId: true, nombre: true, apellido: true, estadoVerificacion: true }
    });
    console.log("=== ÚLTIMOS DOCTORES ===");
    console.log(JSON.stringify(doctores, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
