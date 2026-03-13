"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaServicioHorarioRepository = void 0;
const ServicioHorario_1 = require("../../domain/entities/ServicioHorario");
const ServicioHorarioYaExisteError_1 = require("../../domain/errors/ServiciosHorarios/ServicioHorarioYaExisteError");
const ServicioHorarioNoEncontradoError_1 = require("../../domain/errors/ServiciosHorarios/ServicioHorarioNoEncontradoError");
class PrismaServicioHorarioRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Mapea los datos de Prisma a la entidad ServicioHorario con relaciones
     */
    mapearEntidad(data) {
        return new ServicioHorario_1.ServicioHorario({
            servicioId: data.servicioId,
            horarioId: data.horarioId,
            estado: data.estado,
            creadoEn: data.creadoEn,
            servicio: data.servicio ? {
                id: data.servicio.id,
                nombre: data.servicio.nombre,
                descripcion: data.servicio.descripcion,
                estado: data.servicio.estado,
            } : undefined,
            horario: data.horario ? {
                id: data.horario.id,
                nombre: data.horario.nombre,
                diasSemana: (data.horario.horarios_dias ?? []).map((hd) => hd.dia_semana),
                horaInicio: data.horario.horaInicio,
                horaFin: data.horario.horaFin,
                estado: data.horario.estado,
            } : undefined,
        });
    }
    async crear(datos) {
        try {
            const resultado = await this.prisma.servicioHorario.create({
                data: {
                    servicioId: datos.servicioId,
                    horarioId: datos.horarioId,
                    estado: datos.estado || 'Activo',
                },
            });
            return this.mapearEntidad(resultado);
        }
        catch (error) {
            // Maneja violaciones de constraint de clave foránea
            if (error.code === 'P2003') {
                const constraint = error.meta?.constraint;
                if (constraint === 'servicios_horarios_id_servicio_fkey') {
                    throw new Error(`El servicio con ID ${datos.servicioId} no existe en la base de datos`);
                }
                else if (constraint === 'servicios_horarios_id_horario_fkey') {
                    throw new Error(`El horario con ID ${datos.horarioId} no existe en la base de datos`);
                }
            }
            // Maneja violación de constraint único (relación duplicada)
            if (error.code === 'P2002') {
                throw new ServicioHorarioYaExisteError_1.ServicioHorarioYaExisteError(datos.servicioId, datos.horarioId);
            }
            throw error;
        }
    }
    async obtenerPorIds(servicioId, horarioId) {
        const resultado = await this.prisma.servicioHorario.findUnique({
            where: {
                servicioId_horarioId: {
                    servicioId,
                    horarioId,
                },
            },
            include: {
                servicio: {
                    select: {
                        id: true,
                        nombre: true,
                        descripcion: true,
                        estado: true,
                    },
                },
                horario: {
                    select: {
                        id: true,
                        nombre: true,
                        horaInicio: true,
                        horaFin: true,
                        estado: true,
                    },
                    include: {
                        horarios_dias: { select: { dia_semana: true } },
                    },
                },
            },
        });
        return resultado ? this.mapearEntidad(resultado) : null;
    }
    async obtenerPorServicio(servicioId) {
        const resultados = await this.prisma.servicioHorario.findMany({
            where: {
                servicioId,
            },
            include: {
                servicio: {
                    select: {
                        id: true,
                        nombre: true,
                        descripcion: true,
                        estado: true,
                    },
                },
                horario: {
                    select: {
                        id: true,
                        nombre: true,
                        horaInicio: true,
                        horaFin: true,
                        estado: true,
                    },
                    include: {
                        horarios_dias: { select: { dia_semana: true } },
                    },
                },
            },
            orderBy: {
                horarioId: 'asc',
            },
        });
        return resultados.map((r) => this.mapearEntidad(r));
    }
    async obtenerPorHorario(horarioId) {
        const resultados = await this.prisma.servicioHorario.findMany({
            where: {
                horarioId,
            },
            include: {
                servicio: {
                    select: {
                        id: true,
                        nombre: true,
                        descripcion: true,
                        estado: true,
                    },
                },
                horario: {
                    select: {
                        id: true,
                        nombre: true,
                        horaInicio: true,
                        horaFin: true,
                        estado: true,
                    },
                    include: {
                        horarios_dias: { select: { dia_semana: true } },
                    },
                },
            },
            orderBy: {
                servicioId: 'asc',
            },
        });
        return resultados.map((r) => this.mapearEntidad(r));
    }
    async obtenerTodas(filtros) {
        const pagina = filtros.pagina || 1;
        const limite = filtros.limite || 10;
        const skip = (pagina - 1) * limite;
        const whereClause = {};
        if (filtros.servicioId)
            whereClause.servicioId = filtros.servicioId;
        if (filtros.horarioId)
            whereClause.horarioId = filtros.horarioId;
        if (filtros.estado)
            whereClause.estado = filtros.estado;
        const [resultados, total] = await Promise.all([
            this.prisma.servicioHorario.findMany({
                where: whereClause,
                include: {
                    servicio: {
                        select: {
                            id: true,
                            nombre: true,
                            descripcion: true,
                            estado: true,
                        },
                    },
                    horario: {
                        select: {
                            id: true,
                            nombre: true,
                            horaInicio: true,
                            horaFin: true,
                            estado: true,
                        },
                        include: {
                            horarios_dias: { select: { dia_semana: true } },
                        },
                    },
                },
                skip,
                take: limite,
                orderBy: {
                    creadoEn: 'desc',
                },
            }),
            this.prisma.servicioHorario.count({
                where: whereClause,
            }),
        ]);
        return {
            datos: resultados.map((r) => this.mapearEntidad(r)),
            total,
        };
    }
    async actualizar(servicioId, horarioId, datos) {
        // Verifica que exista la relación original
        const existe = await this.existe(servicioId, horarioId);
        if (!existe) {
            throw new ServicioHorarioNoEncontradoError_1.ServicioHorarioNoEncontradoError(servicioId, horarioId);
        }
        // Si se proporciona una nueva combinación de IDs, validar y ejecutar cambio
        const nuevoServicioId = datos.servicioId ?? servicioId;
        const nuevoHorarioId = datos.horarioId ?? horarioId;
        // Si cambió la combinación, validar que no exista ya
        if (datos.servicioId !== undefined || datos.horarioId !== undefined) {
            if (nuevoServicioId !== servicioId || nuevoHorarioId !== horarioId) {
                const existeNuevaCombinacion = await this.existe(nuevoServicioId, nuevoHorarioId);
                if (existeNuevaCombinacion) {
                    throw new ServicioHorarioYaExisteError_1.ServicioHorarioYaExisteError(nuevoServicioId, nuevoHorarioId);
                }
                // Validar que el nuevo servicio existe
                const servicioExiste = await this.servicioExiste(nuevoServicioId);
                if (!servicioExiste) {
                    throw new Error(`El servicio con ID ${nuevoServicioId} no existe en la base de datos o está inactivo`);
                }
                // Validar que el nuevo horario existe
                const horarioExiste = await this.horarioExiste(nuevoHorarioId);
                if (!horarioExiste) {
                    throw new Error(`El horario con ID ${nuevoHorarioId} no existe en la base de datos o está inactivo`);
                }
                // Eliminar la relación antigua y crear la nueva con el mismo estado
                const relacionActual = await this.obtenerPorIds(servicioId, horarioId);
                await this.prisma.servicioHorario.delete({
                    where: {
                        servicioId_horarioId: {
                            servicioId,
                            horarioId,
                        },
                    },
                });
                const resultado = await this.prisma.servicioHorario.create({
                    data: {
                        servicioId: nuevoServicioId,
                        horarioId: nuevoHorarioId,
                        estado: datos.estado ?? relacionActual.estado,
                    },
                });
                return this.mapearEntidad(resultado);
            }
        }
        // Si solo cambió el estado
        const resultado = await this.prisma.servicioHorario.update({
            where: {
                servicioId_horarioId: {
                    servicioId,
                    horarioId,
                },
            },
            data: {
                estado: datos.estado,
            },
        });
        return this.mapearEntidad(resultado);
    }
    async eliminar(servicioId, horarioId) {
        // Verifica que exista la relación
        const existe = await this.existe(servicioId, horarioId);
        if (!existe) {
            throw new ServicioHorarioNoEncontradoError_1.ServicioHorarioNoEncontradoError(servicioId, horarioId);
        }
        await this.prisma.servicioHorario.update({
            where: {
                servicioId_horarioId: {
                    servicioId,
                    horarioId,
                },
            },
            data: {
                estado: 'Eliminado',
            },
        });
    }
    async existe(servicioId, horarioId) {
        const resultado = await this.prisma.servicioHorario.findUnique({
            where: {
                servicioId_horarioId: {
                    servicioId,
                    horarioId,
                },
            },
        });
        return !!resultado;
    }
    async contar() {
        return await this.prisma.servicioHorario.count();
    }
    /**
     * Valida que un servicio existe
     */
    async servicioExiste(servicioId) {
        const resultado = await this.prisma.servicio.findFirst({
            where: {
                id: servicioId,
                estado: 'Activo'
            },
        });
        return !!resultado;
    }
    /**
     * Valida que un horario existe
     */
    async horarioExiste(horarioId) {
        const resultado = await this.prisma.horario.findFirst({
            where: { id: horarioId, estado: 'Activo' },
        });
        return !!resultado;
    }
}
exports.PrismaServicioHorarioRepository = PrismaServicioHorarioRepository;
