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
        const solicitudes = await this.prisma.solicitudAlianza.findMany({
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
                        anosExperiencia: true,
                        usuario: { select: { email: true, fotoPerfil: true } },
                        especialidades: {
                            where: { estado: 'Activo' },
                            include: { especialidades: { select: { id: true, nombre: true } } }
                        },
                        idiomas: {
                            where: { estado: 'Activo' },
                            select: { id: true, nombre: true, nivel: true }
                        },
                        segurosAceptados: {
                            where: { estado: 'Activo' },
                            include: {
                                seguro: { select: { id: true, nombre: true, urlImage: true } },
                                tipoSeguro: { select: { id: true, nombre: true } },
                            }
                        }
                    }
                },
                centroSalud: {
                    select: { usuarioId: true, nombreComercial: true, foto_perfil: true }
                }
            },
            orderBy: { creadoEn: 'desc' },
        });
        return solicitudes.map((s) => {
            const doctor = s.doctor;
            if (doctor) {
                return {
                    ...s,
                    doctor: {
                        ...doctor,
                        especialidades: (doctor.especialidades || []).map((e) => ({
                            id: e.id_especialidad,
                            nombre: e.especialidades?.nombre,
                            esPrincipal: e.es_principal,
                        })),
                        idiomas: (doctor.idiomas || []).map((i) => ({
                            id: i.id,
                            nombre: i.nombre,
                            nivel: i.nivel,
                        })),
                        seguros: (doctor.segurosAceptados || []).map((ds) => ({
                            id: ds.seguro?.id,
                            nombre: ds.seguro?.nombre,
                            urlImage: ds.seguro?.urlImage || null,
                            tipoSeguro: ds.tipoSeguro ? { id: ds.tipoSeguro.id, nombre: ds.tipoSeguro.nombre } : null,
                        })),
                        anosExperiencia: doctor.anosExperiencia || null,
                        calificacionPromedio: doctor.calificacionPromedio != null
                            ? parseFloat(doctor.calificacionPromedio.toString())
                            : null,
                    }
                };
            }
            return s;
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
    async eliminar(id) {
        await this.prisma.solicitudAlianza.delete({ where: { id } });
    }
}
exports.PrismaSolicitudAlianzaRepository = PrismaSolicitudAlianzaRepository;
