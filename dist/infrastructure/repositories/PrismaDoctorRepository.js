"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaDoctorRepository = void 0;
const Doctor_1 = require("../../domain/entities/Doctor");
class PrismaDoctorRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapearEntidad(data) {
        return new Doctor_1.Doctor(data.usuarioId, data.usuarioId, data.nombre, data.apellido, data.tipoDocIdentificacion, data.numeroDocumentoIdentificacion, data.fechaNacimiento, data.genero, data.nacionalidad, data.exequatur, data.biografia, data.anosExperiencia, data.estadoVerificacion, data.calificacionPromedio ? parseFloat(data.calificacionPromedio.toString()) : null, data.estado, data.creadoEn, data.actualizadoEn, data.duracionCitaPromedio, data.tarifas ? parseFloat(data.tarifas.toString()) : null);
    }
    async obtenerPorId(id) {
        const doctor = await this.prisma.doctor.findUnique({
            where: { usuarioId: id },
            include: {
                usuario: {
                    select: {
                        email: true,
                        telefono: true,
                        fotoPerfil: true,
                    },
                },
                especialidades: {
                    include: {
                        especialidades: true,
                    },
                },
            },
        });
        return doctor ? this.mapearEntidad(doctor) : null;
    }
    async obtenerPorUsuarioId(usuarioId) {
        return this.obtenerPorId(usuarioId);
    }
    async obtenerTodos(filtros) {
        const pagina = filtros.pagina || 1;
        const limite = filtros.limite || 10;
        const skip = (pagina - 1) * limite;
        const where = {};
        if (filtros.nombre) {
            where.nombre = { contains: filtros.nombre, mode: 'insensitive' };
        }
        if (filtros.apellido) {
            where.apellido = { contains: filtros.apellido, mode: 'insensitive' };
        }
        if (filtros.genero) {
            where.genero = filtros.genero;
        }
        if (filtros.nacionalidad) {
            where.nacionalidad = filtros.nacionalidad;
        }
        if (filtros.estadoVerificacion) {
            where.estadoVerificacion = filtros.estadoVerificacion;
        }
        if (filtros.estado) {
            where.estado = filtros.estado;
        }
        else {
            where.estado = { not: 'Eliminado' };
        }
        // Filtrar por especialidad si se proporciona
        if (filtros.especialidadId) {
            where.especialidades = {
                some: {
                    especialidadId: filtros.especialidadId,
                },
            };
        }
        const [datos, total] = await Promise.all([
            this.prisma.doctor.findMany({
                where,
                skip,
                take: limite,
                orderBy: { creadoEn: 'desc' },
                include: {
                    usuario: {
                        select: {
                            email: true,
                            telefono: true,
                            fotoPerfil: true,
                        },
                    },
                    especialidades: {
                        include: {
                            especialidades: true,
                        },
                    },
                },
            }),
            this.prisma.doctor.count({ where }),
        ]);
        return {
            datos: datos.map((d) => this.mapearEntidad(d)),
            total,
        };
    }
    async actualizar(usuarioId, datos) {
        const dataToUpdate = {};
        if (datos.nombre !== undefined)
            dataToUpdate.nombre = datos.nombre;
        if (datos.apellido !== undefined)
            dataToUpdate.apellido = datos.apellido;
        if (datos.biografia !== undefined)
            dataToUpdate.biografia = datos.biografia;
        if (datos.anosExperiencia !== undefined)
            dataToUpdate.anosExperiencia = datos.anosExperiencia;
        if (datos.tarifas !== undefined)
            dataToUpdate.tarifas = datos.tarifas;
        if (datos.duracionCitaPromedio !== undefined)
            dataToUpdate.duracionCitaPromedio = datos.duracionCitaPromedio;
        if (datos.nacionalidad !== undefined)
            dataToUpdate.nacionalidad = datos.nacionalidad;
        if (datos.estado !== undefined)
            dataToUpdate.estado = datos.estado;
        dataToUpdate.actualizadoEn = new Date();
        // Actualizar también el teléfono en la tabla Usuario si se proporciona
        if (datos.telefono !== undefined) {
            await this.prisma.usuario.update({
                where: { id: usuarioId },
                data: { telefono: datos.telefono },
            });
        }
        const doctorActualizado = await this.prisma.doctor.update({
            where: { usuarioId },
            data: dataToUpdate,
            include: {
                usuario: {
                    select: {
                        email: true,
                        telefono: true,
                        fotoPerfil: true,
                    },
                },
                especialidades: {
                    include: {
                        especialidades: true,
                    },
                },
            },
        });
        return this.mapearEntidad(doctorActualizado);
    }
    async eliminar(usuarioId) {
        // Eliminación lógica: actualizar estado en doctor y usuario
        await this.prisma.$transaction([
            this.prisma.doctor.update({
                where: { usuarioId },
                data: {
                    estado: 'Eliminado',
                    actualizadoEn: new Date()
                },
            }),
            this.prisma.usuario.update({
                where: { id: usuarioId },
                data: { estado: 'Inactivo' },
            }),
        ]);
    }
    async existePorExequatur(exequatur, excluirUsuarioId) {
        const where = {
            exequatur: exequatur,
        };
        if (excluirUsuarioId) {
            where.usuarioId = { not: excluirUsuarioId };
        }
        const count = await this.prisma.doctor.count({ where });
        return count > 0;
    }
    async existePorDocumento(numeroDocumento, excluirUsuarioId) {
        const where = {
            numeroDocumentoIdentificacion: numeroDocumento,
        };
        if (excluirUsuarioId) {
            where.usuarioId = { not: excluirUsuarioId };
        }
        const count = await this.prisma.doctor.count({ where });
        return count > 0;
    }
}
exports.PrismaDoctorRepository = PrismaDoctorRepository;
