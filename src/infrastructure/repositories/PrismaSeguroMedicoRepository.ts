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
        const dataConfig: any = {
            nombre: datos.nombre,
            urlImage: datos.urlImage || null,
            estado: 'Activo',
        };

        if (datos.tiposPermitidos && datos.tiposPermitidos.length > 0) {
            dataConfig.seguros_tipos = {
                create: datos.tiposPermitidos.map((id) => ({
                    id_tipo_seguro: id,
                    estado: 'Activo',
                })),
            };
        }

        const seguro = await this.prisma.seguroMedico.create({
            data: dataConfig,
            include: {
                seguros_tipos: {
                    where: { estado: 'Activo' },
                    include: { tipos_seguros: true },
                },
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
                include: {
                    seguros_tipos: {
                        where: { estado: 'Activo' },
                        include: { tipos_seguros: true },
                    },
                },
            }),
            this.prisma.seguroMedico.count({ where }),
        ]);

        return {
            datos: seguros.map((s) => this.mapearSeguroMedico(s)),
            total,
        };
    }

    async actualizar(id: number, datos: ActualizarSeguroMedicoDto): Promise<SeguroMedico> {
        const updateData: any = {
            ...(datos.nombre && { nombre: datos.nombre }),
            ...(datos.urlImage !== undefined && { urlImage: datos.urlImage }),
            ...(datos.estado && { estado: datos.estado }),
        };

        if (datos.tiposPermitidos !== undefined) {
            await this.prisma.$transaction(async (tx) => {
                // Desactivar todos los existentes
                await tx.seguros_tipos.updateMany({
                    where: { id_seguro: id },
                    data: { estado: 'Inactivo' },
                });

                // Upsert los nuevos
                for (const tipoId of datos.tiposPermitidos!) {
                    await tx.seguros_tipos.upsert({
                        where: {
                            id_seguro_id_tipo_seguro: {
                                id_seguro: id,
                                id_tipo_seguro: tipoId,
                            },
                        },
                        update: { estado: 'Activo' },
                        create: {
                            id_seguro: id,
                            id_tipo_seguro: tipoId,
                            estado: 'Activo',
                        },
                    });
                }
            });
        }

        const seguro = await this.prisma.seguroMedico.update({
            where: { id },
            data: updateData,
            include: {
                seguros_tipos: {
                    where: { estado: 'Activo' },
                    include: { tipos_seguros: true },
                },
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

    async obtenerSegurosPaciente(pacienteId: number, incluirHistorial: boolean = false): Promise<any[]> {
        const whereClause: any = { pacienteId };

        // Si no se incluye historial, filtrar solo activos
        if (!incluirHistorial) {
            whereClause.estado = 'Activo';
        }

        const seguros = await this.prisma.pacienteSeguro.findMany({
            where: whereClause,
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
                estado: 'Eliminado',
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
                estado: 'Eliminado',
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

    /**
     * Devuelve los seguros más utilizados por pacientes (con estado Activo),
     * ordenados de mayor a menor número de pacientes activos.
     */
    async obtenerMasUtilizadosPorPacientes(limite: number = 10): Promise<any[]> {
        // Agrupar por seguroId y contar pacientes activos
        const grupos = await this.prisma.pacienteSeguro.groupBy({
            by: ['seguroId'],
            where: { estado: 'Activo' },
            _count: { seguroId: true },
            orderBy: { _count: { seguroId: 'desc' } },
            take: limite,
        });

        if (grupos.length === 0) return [];

        // Obtener los datos completos de cada seguro
        const seguroIds = grupos.map(g => g.seguroId);
        const seguros = await this.prisma.seguroMedico.findMany({
            where: { id: { in: seguroIds } },
        });

        // Mapear manteniendo el orden del ranking
        return grupos.map(grupo => {
            const seguro = seguros.find(s => s.id === grupo.seguroId)!;
            return {
                id: seguro.id,
                nombre: seguro.nombre,
                urlImage: seguro.urlImage,
                estado: seguro.estado,
                totalPacientes: grupo._count.seguroId,
            };
        });
    }

    async verificarCompatibilidadSeguro(
        seguroId: number,
        tipoSeguroId: number,
        doctorId: number,
        pacienteId: number,
    ): Promise<{
        seguroNombre: string;
        tipoSeguroNombre: string;
        doctorAcepta: boolean;
        pacienteTiene: boolean;
        compatible: boolean;
        mensaje: string;
    }> {
        // 1. Obtener nombres del seguro y tipo de seguro
        const [seguro, tipoSeguro] = await Promise.all([
            this.prisma.seguroMedico.findUnique({
                where: { id: seguroId },
                select: { nombre: true },
            }),
            this.prisma.tipoSeguro.findUnique({
                where: { id: tipoSeguroId },
                select: { nombre: true },
            }),
        ]);

        if (!seguro || !tipoSeguro) {
            throw new Error(
                !seguro
                    ? `No existe un seguro médico con ID ${seguroId}.`
                    : `No existe un tipo de seguro con ID ${tipoSeguroId}.`,
            );
        }

        // 2. Verificar en paralelo: doctor acepta + paciente tiene
        const [doctorSeguro, pacienteSeguro] = await Promise.all([
            this.prisma.doctorSeguro.findFirst({
                where: { doctorId, seguroId, tipoSeguroId, estado: 'Activo' },
            }),
            this.prisma.pacienteSeguro.findFirst({
                where: { pacienteId, seguroId, tipoSeguroId, estado: 'Activo' },
            }),
        ]);

        const doctorAcepta = doctorSeguro !== null;
        const pacienteTiene = pacienteSeguro !== null;
        const compatible = doctorAcepta && pacienteTiene;

        let mensaje: string;
        if (compatible) {
            mensaje = `Compatible: el doctor acepta y el paciente tiene el seguro "${seguro.nombre}" (plan: ${tipoSeguro.nombre}).`;
        } else if (!doctorAcepta && !pacienteTiene) {
            mensaje = `El doctor no acepta el seguro "${seguro.nombre}" (plan: ${tipoSeguro.nombre}) y el paciente tampoco lo tiene registrado.`;
        } else if (!doctorAcepta) {
            mensaje = `El doctor no acepta el seguro "${seguro.nombre}" (plan: ${tipoSeguro.nombre}).`;
        } else {
            mensaje = `El paciente no tiene registrado el seguro "${seguro.nombre}" (plan: ${tipoSeguro.nombre}) como activo.`;
        }

        return {
            seguroNombre: seguro.nombre,
            tipoSeguroNombre: tipoSeguro.nombre,
            doctorAcepta,
            pacienteTiene,
            compatible,
            mensaje,
        };
    }


    // ============================================
    // Relación SeguroMedico ↔ TipoSeguro (Admin)
    // ============================================

    async tipoPertenecEAlSeguro(seguroId: number, tipoSeguroId: number): Promise<boolean> {
        const count = await this.prisma.seguros_tipos.count({
            where: { id_seguro: seguroId, id_tipo_seguro: tipoSeguroId, estado: 'Activo' },
        });
        return count > 0;
    }

    async agregarTipoASeguro(seguroId: number, tipoSeguroId: number): Promise<any> {
        // Verificar que no exista ya
        const yaExiste = await this.tipoPertenecEAlSeguro(seguroId, tipoSeguroId);
        if (yaExiste) throw new Error('Este tipo de seguro ya está asociado a esta aseguradora');

        const registro = await this.prisma.seguros_tipos.create({
            data: { id_seguro: seguroId, id_tipo_seguro: tipoSeguroId, estado: 'Activo' },
            include: { seguros_medicos: true, tipos_seguros: true },
        });

        return {
            seguro: { id: registro.seguros_medicos.id, nombre: registro.seguros_medicos.nombre },
            tipoSeguro: { id: registro.tipos_seguros.id, nombre: registro.tipos_seguros.nombre },
            estado: registro.estado,
        };
    }

    async eliminarTipoDeSeguro(seguroId: number, tipoSeguroId: number): Promise<void> {
        await this.prisma.seguros_tipos.update({
            where: { id_seguro_id_tipo_seguro: { id_seguro: seguroId, id_tipo_seguro: tipoSeguroId } },
            data: { estado: 'Inactivo' },
        });
    }

    async obtenerTiposDeSeguro(seguroId: number): Promise<any[]> {
        const registros = await this.prisma.seguros_tipos.findMany({
            where: { id_seguro: seguroId, estado: 'Activo' },
            include: { tipos_seguros: true },
            orderBy: { tipos_seguros: { nombre: 'asc' } },
        });

        return registros.map((r) => ({
            id: r.tipos_seguros.id,
            nombre: r.tipos_seguros.nombre,
            descripcion: r.tipos_seguros.descripcion,
            estado: r.tipos_seguros.estado,
        }));
    }

    // ============================================
    // Mappers
    // ============================================

    private mapearSeguroMedico(seguro: any): SeguroMedico {
        let tiposPermitidos;
        if (seguro.seguros_tipos) {
            tiposPermitidos = seguro.seguros_tipos.map((st: any) => ({
                id: st.tipos_seguros.id,
                nombre: st.tipos_seguros.nombre,
                descripcion: st.tipos_seguros.descripcion,
                estado: st.tipos_seguros.estado,
            }));
        }

        return new SeguroMedico(
            seguro.id,
            seguro.nombre,
            seguro.estado,
            seguro.creadoEn,
            seguro.urlImage,
            tiposPermitidos
        );
    }
}

