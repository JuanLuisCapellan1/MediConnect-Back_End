"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaSolicitudAlianzaRepository = void 0;
class PrismaSolicitudAlianzaRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async crear(datos) {
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
    async buscarPorId(id) {
        return await this.prisma.solicitudAlianza.findUnique({
            where: { id },
            include: {
                doctor: { select: { usuarioId: true, nombre: true, apellido: true } },
                centroSalud: { select: { usuarioId: true, nombreComercial: true } }
            }
        });
    }
    async buscarExistente(doctorId, centroSaludId) {
        return await this.prisma.solicitudAlianza.findFirst({
            where: {
                doctorId,
                centroSaludId,
                estado: { in: ['Pendiente', 'Aceptada'] },
            },
        });
    }
    async listarPorCentro(centroSaludId) {
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
    async listarPorDoctor(doctorId) {
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
    async actualizar(id, datos) {
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
exports.PrismaSolicitudAlianzaRepository = PrismaSolicitudAlianzaRepository;
