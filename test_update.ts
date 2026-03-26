import 'reflect-metadata';
import { container } from './src/shared/container/index';
import { GestionarDoctoresUseCase } from './src/application/use-cases/GestionarDoctoresUseCase';

async function run() {
    try {
        const useCase = container.resolve(GestionarDoctoresUseCase);
        console.log("UseCase resolved.");
        const result = await useCase.actualizar(33, { nombre: "Test Edit", apellido: "Editado" });
        console.log("Actualizado Exitosa. Estado actual:", result.estadoVerificacion);
        
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const acciones = await prisma.accion.findMany({
            where: { tipoAccion: { nombre: 'Registro Doctor' }, emisorId: 33 }
        });
        console.log("Acciones creadas asociadas al doctor 33:", acciones.length);
        await prisma.$disconnect();
    } catch(e) {
        console.error("Error:", e);
    }
}
run();
