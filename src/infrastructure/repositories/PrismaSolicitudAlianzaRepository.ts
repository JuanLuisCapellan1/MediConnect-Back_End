import { PrismaClient } from '@prisma/client';
import { ISolicitudAlianzaRepository } from '../../domain/repositories/ISolicitudAlianzaRepository';

export class PrismaSolicitudAlianzaRepository implements ISolicitudAlianzaRepository {
    constructor(private prisma: PrismaClient) { }

    async crear(datos: {
        doctorId: number;
        centroSaludId: number;
        mensaje?: string;
        iniciadaPor: 'Doctor' | 'Centro';
    }): Promise<any> {
        return await this.prisma.solicitudAlianza.create({
            data: {
                doctorId: datos.doctorId,
                centroSaludId: datos.centroSaludId,
                mensaje: datos.mensaje,
                iniciadaPor: datos.iniciadaPor,
                estado: 'Pendiente',
            },
            include: {
                doctor: {
                    select: {
                        usuarioId: true,
                        nombre: true,
                        apellido: true,
                        exequatur: true,
                        calificacionPromedio: true,
                        estado: true,
                        usuario: { select: { email: true, fotoPerfil: true } },
                        especialidades: {
                            where: { es_principal: true },
                            select: { id_especialidad: true, es_principal: true }
                        }
                    }
                },
                centroSalud: {
                    select: {
                        usuarioId: true,
                        nombreComercial: true,
                        foto_perfil: true,
                        descripcion: true,
                        usuario: { select: { email: true } }
                    }
                }
            }
        });
    }

    async buscarPorId(id: number): Promise<any | null> {
        return await this.prisma.solicitudAlianza.findUnique({
            where: { id },
            include: {
                doctor: { select: { usuarioId: true, nombre: true, apellido: true } },
                centroSalud: { select: { usuarioId: true, nombreComercial: true } }
            }
        });
    }

    async buscarExistente(doctorId: number, centroSaludId: number): Promise<any | null> {
        return await this.prisma.solicitudAlianza.findFirst({
            where: {
                doctorId,
                centroSaludId,
                estado: { in: ['Pendiente', 'Aceptada'] },
            },
        });
    }

    async listarPorCentro(centroSaludId: number): Promise<any[]> {
        return await this.prisma.solicitudAlianza.findMany({
            where: { centroSaludId },
            include: {
                doctor: {
                    select: {
                        usuarioId: true,
                        nombre: true,
                        apellido: true,
                        exequatur: true,
                        calificacionPromedio: true,
                        estado: true,
                        usuario: { select: { email: true, fotoPerfil: true } },
                        especialidades: {
                            where: { es_principal: true },
                            select: { id_especialidad: true, es_principal: true }
                        }
                    }
                },
                centroSalud: {
                    select: { usuarioId: true, nombreComercial: true, foto_perfil: true }
                }
            },
            orderBy: { creadoEn: 'desc' },
        });
    }

    async listarPorDoctor(doctorId: number): Promise<any[]> {
        return await this.prisma.solicitudAlianza.findMany({
            where: { doctorId },
            include: {
                doctor: {
                    select: { usuarioId: true, nombre: true, apellido: true }
                },
                centroSalud: {
                    select: {
                        usuarioId: true,
                        nombreComercial: true,
                        foto_perfil: true,
                        descripcion: true,
                        usuario: { select: { email: true } }
                    }
                }
            },
            orderBy: { creadoEn: 'desc' },
        });
    }

    async actualizar(id: number, datos: {
        estado?: string;
        motivoRechazo?: string | null;
    }): Promise<any> {
        return await this.prisma.solicitudAlianza.update({
            where: { id },
            data: { ...datos, actualizadoEn: new Date() },
            include: {
                doctor: { select: { usuarioId: true, nombre: true, apellido: true } },
                centroSalud: { select: { usuarioId: true, nombreComercial: true } }
            }
        });
    }
}
