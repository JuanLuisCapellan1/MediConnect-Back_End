import { PrismaClient } from '@prisma/client';
import { IDoctorIdiomaRepository } from '../../domain/repositories/IDoctorIdiomaRepository';
import { DoctorIdioma } from '../../domain/entities/DoctorIdioma';
import { AgregarIdiomaDto, ActualizarIdiomaDto } from '../../application/dtos/DoctorDtos';

export class PrismaDoctorIdiomaRepository implements IDoctorIdiomaRepository {
    constructor(private prisma: PrismaClient) { }

    private mapearEntidad(data: any): DoctorIdioma {
        return new DoctorIdioma(
            data.id,
            data.doctorId,
            data.nombre,
            data.nivel,
            data.estado,
            data.creadoEn,
            data.actualizadoEn
        );
    }

    async agregar(doctorId: number, dto: AgregarIdiomaDto): Promise<DoctorIdioma> {
        const idioma = await this.prisma.doctorIdioma.create({
            data: {
                doctorId,
                nombre: dto.nombre,
                nivel: dto.nivel || 'Intermedio',
                estado: 'Activo',
            },
        });

        return this.mapearEntidad(idioma);
    }

    async obtenerPorId(id: number): Promise<DoctorIdioma | null> {
        const idioma = await this.prisma.doctorIdioma.findUnique({
            where: { id },
        });

        return idioma ? this.mapearEntidad(idioma) : null;
    }

    async obtenerPorDoctorId(doctorId: number): Promise<DoctorIdioma[]> {
        const idiomas = await this.prisma.doctorIdioma.findMany({
            where: {
                doctorId,
                estado: 'Activo',
            },
            orderBy: {
                creadoEn: 'desc',
            },
        });

        return idiomas.map((i) => this.mapearEntidad(i));
    }

    async actualizar(id: number, dto: ActualizarIdiomaDto): Promise<DoctorIdioma> {
        const dataToUpdate: any = {};

        if (dto.nombre !== undefined) dataToUpdate.nombre = dto.nombre;
        if (dto.nivel !== undefined) dataToUpdate.nivel = dto.nivel;
        dataToUpdate.actualizadoEn = new Date();

        const idioma = await this.prisma.doctorIdioma.update({
            where: { id },
            data: dataToUpdate,
        });

        return this.mapearEntidad(idioma);
    }

    async eliminar(id: number): Promise<void> {
        await this.prisma.doctorIdioma.delete({
            where: { id },
        });
    }
}
