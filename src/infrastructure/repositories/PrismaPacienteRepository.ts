import { PrismaClient } from '@prisma/client';
import { IPacienteRepository } from '../../domain/repositories/IPacienteRepository';
import { Paciente } from '../../domain/entities/Paciente';
import { ActualizarPacienteDto, FiltroPacientesDto } from '../../application/dtos/PacienteDtos';

export class PrismaPacienteRepository implements IPacienteRepository {
    constructor(private prisma: PrismaClient) { }

    /** Include completo utilizado en todos los métodos de lectura */
    private get pacienteInclude() {
        return {
            usuario: {
                select: {
                    email: true,
                    telefono: true,
                    fotoPerfil: true,
                    banner: true,
                    rol: true,
                },
            },
            ubicacion: {
                select: {
                    id: true,
                    nombre: true,
                    direccion: true,
                    codigoPostal: true,
                    barrio: {
                        select: {
                            id: true,
                            nombre: true,
                            seccion: {
                                select: {
                                    id: true,
                                    nombre: true,
                                    distritoMunicipal: {
                                        select: {
                                            id: true,
                                            nombre: true,
                                            municipio: {
                                                select: {
                                                    id: true,
                                                    nombre: true,
                                                    provincia: {
                                                        select: { id: true, nombre: true }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            seguros: {
                where: { estado: { not: 'Eliminado' } },
                include: {
                    seguro: true,
                    tipoSeguro: true,
                },
                orderBy: { creadoEn: 'desc' as const },
            },
            caracteristicas: {
                where: { estado: { not: 'Eliminado' } },
                include: {
                    condicion: true,
                },
                orderBy: { registradoEn: 'desc' as const },
            },
        };
    }

    private mapearEntidad(data: any): any {
        const base = new Paciente(
            data.usuarioId,
            data.usuarioId,
            data.nombre,
            data.apellido,
            data.tipoDocIdentificacion,
            data.numero_documento_identificacion,
            data.foto_documento,
            data.fechaNacimiento,
            data.genero,
            data.altura ? parseFloat(data.altura.toString()) : null,
            data.peso ? parseFloat(data.peso.toString()) : null,
            data.tipoSangre,
            data.ubicacionId,
            data.estado,
            data.creadoEn,
            data.actualizadoEn
        );

        return {
            ...base,
            email: data.usuario?.email ?? null,
            telefono: data.usuario?.telefono ?? null,
            fotoPerfil: data.usuario?.fotoPerfil ?? null,
            banner: data.usuario?.banner ?? null,
            rol: data.usuario?.rol ?? null,
            ubicacion: data.ubicacion ?? null,
            seguros: data.seguros ?? [],
            condicionesMedicas: data.caracteristicas ?? [],
        };
    }

    async obtenerPorId(id: number): Promise<any | null> {
        const paciente = await this.prisma.paciente.findUnique({
            where: { usuarioId: id },
            include: this.pacienteInclude,
        });

        return paciente ? this.mapearEntidad(paciente) : null;
    }

    async obtenerPorUsuarioId(usuarioId: number): Promise<Paciente | null> {
        return this.obtenerPorId(usuarioId);
    }

    async obtenerTodos(filtros: FiltroPacientesDto): Promise<{ datos: Paciente[]; total: number }> {
        const pagina = filtros.pagina || 1;
        const limite = filtros.limite || 10;
        const skip = (pagina - 1) * limite;

        const where: any = {};

        if (filtros.nombre) {
            where.nombre = { contains: filtros.nombre, mode: 'insensitive' };
        }

        if (filtros.apellido) {
            where.apellido = { contains: filtros.apellido, mode: 'insensitive' };
        }

        if (filtros.genero) {
            where.genero = filtros.genero;
        }

        if (filtros.tipoSangre) {
            where.tipoSangre = filtros.tipoSangre;
        }

        if (filtros.estado) {
            where.estado = filtros.estado;
        } else {
            where.estado = { not: 'Eliminado' };
        }

        const [datos, total] = await Promise.all([
            this.prisma.paciente.findMany({
                where,
                skip,
                take: limite,
                orderBy: { creadoEn: 'desc' },
                include: this.pacienteInclude,
            }),
            this.prisma.paciente.count({ where }),
        ]);

        return {
            datos: datos.map((d) => this.mapearEntidad(d)),
            total,
        };
    }

    async actualizar(usuarioId: number, datos: ActualizarPacienteDto): Promise<Paciente> {
        const dataToUpdate: any = {};

        if (datos.nombre !== undefined) dataToUpdate.nombre = datos.nombre;
        if (datos.apellido !== undefined) dataToUpdate.apellido = datos.apellido;
        if (datos.fechaNacimiento !== undefined) dataToUpdate.fechaNacimiento = datos.fechaNacimiento;
        if (datos.genero !== undefined) dataToUpdate.genero = datos.genero;
        if (datos.altura !== undefined) dataToUpdate.altura = datos.altura;
        if (datos.peso !== undefined) dataToUpdate.peso = datos.peso;
        if (datos.tipoSangre !== undefined) dataToUpdate.tipoSangre = datos.tipoSangre;
        if (datos.ubicacionId !== undefined) dataToUpdate.ubicacionId = datos.ubicacionId;
        if (datos.estado !== undefined) dataToUpdate.estado = datos.estado;

        dataToUpdate.actualizadoEn = new Date();

        // Actualizar también el teléfono en la tabla Usuario si se proporciona
        if (datos.telefono !== undefined) {
            await this.prisma.usuario.update({
                where: { id: usuarioId },
                data: { telefono: datos.telefono },
            });
        }

        const pacienteActualizado = await this.prisma.paciente.update({
            where: { usuarioId },
            data: dataToUpdate,
            include: this.pacienteInclude,
        });

        return this.mapearEntidad(pacienteActualizado);
    }

    async eliminar(usuarioId: number): Promise<void> {
        // Eliminación lógica: actualizar estado en paciente y usuario
        await this.prisma.$transaction([
            this.prisma.paciente.update({
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

    async existePorDocumento(numeroDocumento: string, excluirUsuarioId?: number): Promise<boolean> {
        const where: any = {
            numero_documento_identificacion: numeroDocumento,
        };

        if (excluirUsuarioId) {
            where.usuarioId = { not: excluirUsuarioId };
        }

        const count = await this.prisma.paciente.count({ where });
        return count > 0;
    }
}
