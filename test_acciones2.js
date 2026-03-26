const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const rs = await prisma.accion.findMany({
    orderBy: { id: 'desc' },
    take: 10,
    include: { tipoAccion: true, emisor: true }
  });
  console.log(JSON.stringify(rs, null, 2));
}
run();
