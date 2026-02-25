import { PrismaClient } from '@prisma/client';
import { ICitaRepository } from '../../domain/repositories/ICitaRepository';

const CITA_INCLUDE = {
    paciente: {
        include: {
            usuario: {
                select: { email: true, telefono: true, fotoPerfil: true },
            },
        },
    },
    doctor: {
        include: {
            usuario: {
                select: { email: true, telefono: true, fotoPerfil: true },
            },
            especialidades: {
                where: { es_principal: true },
                include: { especialidades: { select: { id: true, nombre: true } } },
            },
        },
    },
    servicio: {
        include: {
            tipoServicio: true,
            especialidad: { select: { id: true, nombre: true } },
            imagenes: { where: { estado: 'Activo' }, orderBy: { orden: 'asc' as const } },
        },
    },
    horario: true,
    seguro: { select: { id: true, nombre: true, urlImage: true } },
    tipoSeguro: { select: { id: true, nombre: true } },
    ubicacion: true,
    historial: {
        include: { adjuntos: { include: { media: true } } },
    },
} as any;

export class PrismaCitaRepository implements ICitaRepository {
    constructor(private prisma: PrismaClient) { }

    async crear(datos: {
        pacienteId: number;
        doctorId: number;
        servicioId: number;
        horarioId?: number;
        fechaInicio: Date;
        fechaFin: Date;
        modalidad: string;
        numPacientes: number;
        seguroId?: number;
        tipoSeguroId?: number;
        motivoConsulta?: string;
        totalAPagar: number;
        ubicacionId?: number;
        grupoId?: number;
    }): Promise<any> {
        return await (this.prisma.cita as any).create({
            data: {
                pacienteId: datos.pacienteId,
                doctorUsuarioId: datos.doctorId,
                servicioId: datos.servicioId,
                horarioId: datos.horarioId ?? null,
                fechaInicio: datos.fechaInicio,
                fechaFin: datos.fechaFin,
                modalidad: datos.modalidad,
                numPacientes: datos.numPacientes,
                seguroId: datos.seguroId ?? null,
                tipoSeguroId: datos.tipoSeguroId ?? null,
                motivoConsulta: datos.motivoConsulta ?? null,
                totalAPagar: datos.totalAPagar,
                ubicacionId: datos.ubicacionId ?? null,
                id_grupo: datos.grupoId ?? null,
                estado: 'Programada',
            },
            include: CITA_INCLUDE,
        });
    }

    async buscarPorId(id: number): Promise<any | null> {
        return await (this.prisma.cita as any).findUnique({
            where: { id },
            include: CITA_INCLUDE,
        });
    }

    async listarPorPaciente(
        pacienteId: number,
        filtros: { estado?: string; pagina?: number; limite?: number; fechaDesde?: Date; fechaHasta?: Date }
    ): Promise<{ datos: any[]; total: number }> {
        const pagina = filtros.pagina ?? 1;
        const limite = filtros.limite ?? 10;
        const skip = (pagina - 1) * limite;

        const where: any = { pacienteId };
        if (filtros.estado) where.estado = filtros.estado;
        if (filtros.fechaDesde || filtros.fechaHasta) {
            where.fechaInicio = {};
            if (filtros.fechaDesde) where.fechaInicio.gte = filtros.fechaDesde;
            if (filtros.fechaHasta) where.fechaInicio.lte = filtros.fechaHasta;
        }

        const [datos, total] = await Promise.all([
            (this.prisma.cita as any).findMany({
                where,
                include: CITA_INCLUDE,
                orderBy: { fechaInicio: 'desc' },
                skip,
                take: limite,
            }),
            (this.prisma.cita as any).count({ where }),
        ]);

        return { datos, total };
    }

    async listarPorDoctor(
        doctorId: number,
        filtros: { estado?: string; pagina?: number; limite?: number; fechaDesde?: Date; fechaHasta?: Date }
    ): Promise<{ datos: any[]; total: number }> {
        const pagina = filtros.pagina ?? 1;
        const limite = filtros.limite ?? 10;
        const skip = (pagina - 1) * limite;

        const where: any = { doctorUsuarioId: doctorId };
        if (filtros.estado) where.estado = filtros.estado;
        if (filtros.fechaDesde || filtros.fechaHasta) {
            where.fechaInicio = {};
            if (filtros.fechaDesde) where.fechaInicio.gte = filtros.fechaDesde;
            if (filtros.fechaHasta) where.fechaInicio.lte = filtros.fechaHasta;
        }

        const [datos, total] = await Promise.all([
            (this.prisma.cita as any).findMany({
                where,
                include: CITA_INCLUDE,
                orderBy: { fechaInicio: 'asc' },
                skip,
                take: limite,
            }),
            (this.prisma.cita as any).count({ where }),
        ]);

        return { datos, total };
    }

    async actualizar(id: number, datos: any): Promise<any> {
        return await (this.prisma.cita as any).update({
            where: { id },
            data: { ...datos, actualizadoEn: new Date() },
            include: CITA_INCLUDE,
        });
    }

    async crearHistorial(datos: {
        citaId: number;
        pacienteId: number;
        resumen: string;
        diagnostico: string;
        tratamiento?: string;
        observacion?: string;
    }): Promise<any> {
        return await this.prisma.historialConsulta.create({
            data: {
                citaId: datos.citaId,
                pacienteId: datos.pacienteId,
                resumen: datos.resumen,
                diagnostico: datos.diagnostico,
                tratamiento: datos.tratamiento ?? null,
                observacion: datos.observacion ?? null,
            },
            include: {
                cita: {
                    include: {
                        doctor: { include: { usuario: { select: { email: true, fotoPerfil: true } } } },
                        servicio: { include: { especialidad: true } },
                    },
                },
                adjuntos: { include: { media: true } },
            },
        });
    }

    async buscarHistorialPorCita(citaId: number): Promise<any | null> {
        return await this.prisma.historialConsulta.findUnique({
            where: { citaId },
            include: {
                cita: {
                    include: {
                        doctor: {
                            include: {
                                usuario: { select: { email: true, fotoPerfil: true } },
                                especialidades: {
                                    where: { es_principal: true },
                                    include: { especialidades: { select: { nombre: true } } },
                                },
                            },
                        },
                        paciente: { include: { usuario: { select: { email: true } } } },
                        servicio: { include: { especialidad: true, tipoServicio: true } },
                        seguro: { select: { nombre: true, urlImage: true } },
                        tipoSeguro: { select: { nombre: true } },
                    },
                },
                adjuntos: { include: { media: true } },
            },
        });
    }

    async listarHistorialPaciente(
        pacienteId: number,
        filtros: { pagina?: number; limite?: number }
    ): Promise<{ datos: any[]; total: number }> {
        const pagina = filtros.pagina ?? 1;
        const limite = filtros.limite ?? 10;
        const skip = (pagina - 1) * limite;

        const [datos, total] = await Promise.all([
            this.prisma.historialConsulta.findMany({
                where: { pacienteId },
                include: {
                    cita: {
                        include: {
                            doctor: {
                                include: {
                                    usuario: { select: { email: true, fotoPerfil: true } },
                                    especialidades: {
                                        where: { es_principal: true },
                                        include: { especialidades: { select: { nombre: true } } },
                                    },
                                },
                            },
                            servicio: { include: { especialidad: true, tipoServicio: true } },
                            seguro: { select: { nombre: true, urlImage: true } },
                            tipoSeguro: { select: { nombre: true } },
                        },
                    },
                    adjuntos: { include: { media: true } },
                },
                orderBy: { creadoEn: 'desc' },
                skip,
                take: limite,
            }),
            this.prisma.historialConsulta.count({ where: { pacienteId } }),
        ]);

        return { datos, total };
    }
}
