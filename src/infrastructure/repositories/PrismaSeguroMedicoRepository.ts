import { PrismaClient } from '@prisma/client';
import { ISeguroMedicoRepository } from '../../domain/repositories/ISeguroMedicoRepository';
import { SeguroMedico } from '../../domain/entities/SeguroMedico';
import {
    CrearSeguroMedicoDto,
    ActualizarSeguroMedicoDto,
    AgregarSeguroPacienteDto,
    AgregarSeguroDoctorDto,
    FiltroSegurosDto,
} from '../../application/dtos/SeguroMedicoDtos';

export class PrismaSeguroMedicoRepository implements ISeguroMedicoRepository {
    constructor(private prisma: PrismaClient) { }

    // ============================================
    // Admin - CRUD completo
    // ============================================

    async crear(datos: CrearSeguroMedicoDto): Promise<SeguroMedico> {
        const seguro = await this.prisma.seguroMedico.create({
            data: {
                nombre: datos.nombre,
                urlImage: datos.urlImage || null,
                estado: 'Activo',
            },
        });

        return this.mapearSeguroMedico(seguro);
    }

    async obtenerPorId(id: number): Promise<SeguroMedico | null> {
        const seguro = await this.prisma.seguroMedico.findUnique({
            where: { id },
        });

        return seguro ? this.mapearSeguroMedico(seguro) : null;
    }

    async obtenerTodos(filtros: FiltroSegurosDto): Promise<{ datos: SeguroMedico[]; total: number }> {
        const pagina = filtros.pagina || 1;
        const limite = filtros.limite || 20;
        const skip = (pagina - 1) * limite;

        const where: any = {};
        if (filtros.estado) {
            where.estado = filtros.estado;
        }

        const [seguros, total] = await Promise.all([
            this.prisma.seguroMedico.findMany({
                where,
                skip,
                take: limite,
                orderBy: { nombre: 'asc' },
            }),
            this.prisma.seguroMedico.count({ where }),
        ]);

        return {
            datos: seguros.map((s) => this.mapearSeguroMedico(s)),
            total,
        };
    }

    async actualizar(id: number, datos: ActualizarSeguroMedicoDto): Promise<SeguroMedico> {
        const seguro = await this.prisma.seguroMedico.update({
            where: { id },
            data: {
                ...(datos.nombre && { nombre: datos.nombre }),
                ...(datos.urlImage !== undefined && { urlImage: datos.urlImage }),
                ...(datos.estado && { estado: datos.estado }),
            },
        });

        return this.mapearSeguroMedico(seguro);
    }

    async eliminar(id: number): Promise<void> {
        await this.prisma.seguroMedico.update({
            where: { id },
            data: { estado: 'Inactivo' },
        });
    }

    // ============================================
    // Paciente - Gestión de seguros (máximo 3)
    // ============================================

    async agregarSeguroPaciente(pacienteId: number, dto: AgregarSeguroPacienteDto): Promise<any> {
        const pacienteSeguro = await this.prisma.pacienteSeguro.create({
            data: {
                pacienteId,
                seguroId: dto.idSeguro,
                tipoSeguroId: dto.idTipoSeguro,
                estado: 'Activo',
            },
            include: {
                seguro: true,
                tipoSeguro: true,
            },
        });

        return {
            seguro: this.mapearSeguroMedico(pacienteSeguro.seguro),
            tipoSeguro: {
                id: pacienteSeguro.tipoSeguro.id,
                nombre: pacienteSeguro.tipoSeguro.nombre,
                descripcion: pacienteSeguro.tipoSeguro.descripcion,
            },
            estado: pacienteSeguro.estado,
            creadoEn: pacienteSeguro.creadoEn,
        };
    }

    async obtenerSegurosPaciente(pacienteId: number): Promise<any[]> {
        const seguros = await this.prisma.pacienteSeguro.findMany({
            where: {
                pacienteId,
                estado: 'Activo',
            },
            include: {
                seguro: true,
                tipoSeguro: true,
            },
            orderBy: { creadoEn: 'desc' },
        });

        return seguros.map((ps) => ({
            seguro: this.mapearSeguroMedico(ps.seguro),
            tipoSeguro: {
                id: ps.tipoSeguro.id,
                nombre: ps.tipoSeguro.nombre,
                descripcion: ps.tipoSeguro.descripcion,
            },
            estado: ps.estado,
            creadoEn: ps.creadoEn,
        }));
    }

    async eliminarSeguroPaciente(pacienteId: number, seguroId: number): Promise<void> {
        await this.prisma.pacienteSeguro.updateMany({
            where: {
                pacienteId,
                seguroId,
            },
            data: {
                estado: 'Inactivo',
                actualizadoEn: new Date(),
            },
        });
    }

    async contarSegurosActivosPaciente(pacienteId: number): Promise<number> {
        return await this.prisma.pacienteSeguro.count({
            where: {
                pacienteId,
                estado: 'Activo',
            },
        });
    }

    async verificarSeguroExistentePaciente(pacienteId: number, seguroId: number): Promise<boolean> {
        const count = await this.prisma.pacienteSeguro.count({
            where: {
                pacienteId,
                seguroId,
                estado: 'Activo',
            },
        });
        return count > 0;
    }

    // ============================================
    // Doctor - Gestión de seguros (ilimitado)
    // ============================================

    async agregarSeguroDoctor(doctorId: number, dto: AgregarSeguroDoctorDto): Promise<any> {
        const doctorSeguro = await this.prisma.doctorSeguro.create({
            data: {
                doctorId,
                seguroId: dto.idSeguro,
                tipoSeguroId: dto.idTipoSeguro,
                estado: 'Activo',
            },
            include: {
                seguro: true,
                tipoSeguro: true,
            },
        });

        return {
            seguro: this.mapearSeguroMedico(doctorSeguro.seguro),
            tipoSeguro: {
                id: doctorSeguro.tipoSeguro.id,
                nombre: doctorSeguro.tipoSeguro.nombre,
                descripcion: doctorSeguro.tipoSeguro.descripcion,
            },
            estado: doctorSeguro.estado,
            creadoEn: doctorSeguro.creadoEn,
        };
    }

    async obtenerSegurosDoctor(doctorId: number): Promise<any[]> {
        const seguros = await this.prisma.doctorSeguro.findMany({
            where: {
                doctorId,
                estado: 'Activo',
            },
            include: {
                seguro: true,
                tipoSeguro: true,
            },
            orderBy: { creadoEn: 'desc' },
        });

        return seguros.map((ds) => ({
            seguro: this.mapearSeguroMedico(ds.seguro),
            tipoSeguro: {
                id: ds.tipoSeguro.id,
                nombre: ds.tipoSeguro.nombre,
                descripcion: ds.tipoSeguro.descripcion,
            },
            estado: ds.estado,
            creadoEn: ds.creadoEn,
        }));
    }

    async eliminarSeguroDoctor(doctorId: number, seguroId: number, tipoSeguroId: number): Promise<void> {
        await this.prisma.doctorSeguro.updateMany({
            where: {
                doctorId,
                seguroId,
                tipoSeguroId,
            },
            data: {
                estado: 'Inactivo',
                actualizadoEn: new Date(),
            },
        });
    }

    async verificarSeguroExistenteDoctor(
        doctorId: number,
        seguroId: number,
        tipoSeguroId: number
    ): Promise<boolean> {
        const count = await this.prisma.doctorSeguro.count({
            where: {
                doctorId,
                seguroId,
                tipoSeguroId,
                estado: 'Activo',
            },
        });
        return count > 0;
    }

    // ============================================
    // Utilidades
    // ============================================

    async existeNombre(nombre: string, excluirId?: number): Promise<boolean> {
        const count = await this.prisma.seguroMedico.count({
            where: {
                nombre,
                ...(excluirId && { id: { not: excluirId } }),
            },
        });
        return count > 0;
    }

    // ============================================
    // Mappers
    // ============================================

    private mapearSeguroMedico(seguro: any): SeguroMedico {
        return new SeguroMedico(
            seguro.id,
            seguro.nombre,
            seguro.estado,
            seguro.creadoEn,
            seguro.urlImage
        );
    }
}
