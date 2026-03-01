import { injectable, inject } from 'tsyringe';
import { IResenaRepository } from '../../domain/repositories/IResenaRepository';
import { CrearResenaDto, FiltroResenasDto } from '../dtos/ResenaDtos';

@injectable()
export class GestionarResenasUseCase {
    constructor(
        @inject('ResenaRepository') private resenaRepo: IResenaRepository
    ) { }

    // ===================================================================
    // PACIENTE: Crear una reseña para un servicio
    // ===================================================================
    async crearResena(pacienteId: number, dto: CrearResenaDto): Promise<any> {
        // Validar rango de calificación
        if (!Number.isInteger(dto.calificacion) || dto.calificacion < 1 || dto.calificacion > 5) {
            throw new Error('La calificación debe ser un número entero del 1 al 5.');
        }

        // Verificar que el servicio existe y obtener el doctorId
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        const servicio = await (prisma as any).servicio.findUnique({
            where: { id: dto.servicioId },
            select: { id: true, doctorId: true, estado: true }
        });

        if (!servicio) {
            await prisma.$disconnect();
            throw new Error('El servicio no existe.');
        }
        if (servicio.estado !== 'Activo') {
            await prisma.$disconnect();
            throw new Error('No puedes reseñar un servicio que no está activo.');
        }

        // Si se proporciona citaId, verificar que la cita esté Completada y le pertenezca al paciente
        if (dto.citaId) {
            const cita = await (prisma as any).cita.findUnique({
                where: { id: dto.citaId },
                select: { id: true, pacienteId: true, estado: true, servicioId: true }
            });
            if (!cita) {
                await prisma.$disconnect();
                throw new Error('La cita referenciada no existe.');
            }
            if (cita.pacienteId !== pacienteId) {
                await prisma.$disconnect();
                throw new Error('No tienes permisos para reseñar usando esa cita.');
            }
            if (cita.estado !== 'Completada') {
                await prisma.$disconnect();
                throw new Error('Solo puedes reseñar una cita que haya sido completada.');
            }
            if (cita.servicioId !== dto.servicioId) {
                await prisma.$disconnect();
                throw new Error('La cita no corresponde al servicio indicado.');
            }
        }

        await prisma.$disconnect();

        // Verificar que el paciente no haya reseñado este servicio antes
        const yaReseñado = await this.resenaRepo.existeResena(pacienteId, dto.servicioId);
        if (yaReseñado) {
            throw new Error('Ya has calificado este servicio anteriormente.');
        }

        return await this.resenaRepo.crear({
            servicioId: dto.servicioId,
            pacienteId,
            doctorId: servicio.doctorId,
            calificacion: dto.calificacion,
            comentario: dto.comentario ?? null,
            citaId: dto.citaId ?? null,
        });
    }

    // ===================================================================
    // PÚBLICO: Listar reseñas de un servicio
    // ===================================================================
    async listarPorServicio(
        servicioId: number,
        filtros: FiltroResenasDto
    ): Promise<{ datos: any[]; total: number }> {
        return await this.resenaRepo.listarPorServicio(servicioId, filtros.pagina, filtros.limite);
    }

    // ===================================================================
    // PÚBLICO: Listar reseñas de un doctor (a través de sus servicios)
    // ===================================================================
    async listarPorDoctor(
        doctorId: number,
        filtros: FiltroResenasDto
    ): Promise<{ datos: any[]; total: number }> {
        return await this.resenaRepo.listarPorDoctor(doctorId, filtros.pagina, filtros.limite);
    }

    // ===================================================================
    // PACIENTE: Ver sus propias reseñas
    // ===================================================================
    async misResenas(pacienteId: number): Promise<any[]> {
        return await this.resenaRepo.listarMias(pacienteId);
    }

    // ===================================================================
    // PACIENTE: Eliminar su propia reseña
    // ===================================================================
    async eliminarResena(resenaId: number, pacienteId: number): Promise<void> {
        const resena = await this.resenaRepo.buscarPorId(resenaId);
        if (!resena) throw new Error('Reseña no encontrada.');
        if (resena.pacienteId !== pacienteId) {
            throw new Error('No tienes permisos para eliminar esta reseña.');
        }
        await this.resenaRepo.eliminar(resenaId);
    }
}
