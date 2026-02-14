import { PrismaClient } from '@prisma/client';
import { ICondicionMedicaRepository } from '../../domain/repositories/ICondicionMedicaRepository';
import { CondicionMedica } from '../../domain/entities/CondicionMedica';
import { CaracteristicaEspecial } from '../../domain/entities/CaracteristicaEspecial';
import {
    CrearCondicionMedicaDto,
    ActualizarCondicionMedicaDto,
    FiltroCondicionesMedicasDto,
    AsignarCondicionPacienteDto,
    ActualizarCondicionPacienteDto,
    FiltroCondicionesPacienteDto,
} from '../../application/dtos/CondicionMedicaDtos';

export class PrismaCondicionMedicaRepository implements ICondicionMedicaRepository {
    constructor(private prisma: PrismaClient) { }

    private mapearCondicionMedica(data: any): CondicionMedica {
        return new CondicionMedica({
            id: data.id,
            nombre: data.nombre,
            descripcion: data.descripcion,
            tipo: data.tipo,
            estado: data.estado,
            creadoEn: data.creadoEn,
        });
    }

    private mapearCaracteristicaEspecial(data: any): CaracteristicaEspecial {
        return new CaracteristicaEspecial({
            pacienteId: data.pacienteId,
            condicionId: data.condicionId,
            notas: data.notas,
            estado: data.estado,
            registradoEn: data.registradoEn,
            actualizadoEn: data.actualizadoEn,
            condicion: data.condicion ? this.mapearCondicionMedica(data.condicion) : undefined,
        });
    }

    // CRUD de Condiciones Médicas
    async crear(datos: CrearCondicionMedicaDto): Promise<CondicionMedica> {
        const nuevo = await this.prisma.condicionMedica.create({
            data: {
                nombre: datos.nombre,
                descripcion: datos.descripcion,
                tipo: datos.tipo,
            },
        });
        return this.mapearCondicionMedica(nuevo);
    }

    async obtenerPorId(id: number): Promise<CondicionMedica | null> {
        const encontrado = await this.prisma.condicionMedica.findUnique({
            where: { id },
        });
        return encontrado ? this.mapearCondicionMedica(encontrado) : null;
    }

    async obtenerTodas(
        filtros: FiltroCondicionesMedicasDto
    ): Promise<{ datos: CondicionMedica[]; total: number }> {
        const pagina = filtros.pagina || 1;
        const limite = filtros.limite || 10;
        const skip = (pagina - 1) * limite;

        const where: any = {};

        if (filtros.nombre) {
            where.nombre = { contains: filtros.nombre, mode: 'insensitive' };
        }

        if (filtros.tipo) {
            where.tipo = filtros.tipo;
        }

        if (filtros.estado) {
            where.estado = filtros.estado;
        } else {
            where.estado = { not: 'Eliminada' };
        }

        const [datos, total] = await Promise.all([
            this.prisma.condicionMedica.findMany({
                where,
                skip,
                take: limite,
                orderBy: { nombre: 'asc' },
            }),
            this.prisma.condicionMedica.count({ where }),
        ]);

        return {
            datos: datos.map((d) => this.mapearCondicionMedica(d)),
            total,
        };
    }

    async actualizar(
        id: number,
        datos: ActualizarCondicionMedicaDto
    ): Promise<CondicionMedica> {
        const actualizado = await this.prisma.condicionMedica.update({
            where: { id },
            data: {
                ...datos,
            },
        });
        return this.mapearCondicionMedica(actualizado);
    }

    async eliminar(id: number): Promise<void> {
        await this.prisma.condicionMedica.update({
            where: { id },
            data: { estado: 'Eliminada' },
        });
    }

    async existeNombre(nombre: string, excluirId?: number): Promise<boolean> {
        const where: any = {
            nombre: { equals: nombre, mode: 'insensitive' },
            estado: { not: 'Eliminada' },
        };

        if (excluirId) {
            where.id = { not: excluirId };
        }

        const count = await this.prisma.condicionMedica.count({ where });
        return count > 0;
    }

    // Gestión de Condiciones de Pacientes (para Doctores)
    async asignarAPaciente(datos: AsignarCondicionPacienteDto): Promise<CaracteristicaEspecial> {
        const nueva = await this.prisma.caracteristicaEspecial.create({
            data: {
                pacienteId: datos.pacienteId,
                condicionId: datos.condicionId,
                notas: datos.notas,
            },
        });
        return this.mapearCaracteristicaEspecial(nueva);
    }

    async obtenerCondicionesPaciente(
        pacienteId: number,
        filtros: FiltroCondicionesPacienteDto
    ): Promise<CaracteristicaEspecial[]> {
        const where: any = {
            pacienteId,
        };

        if (filtros.estado) {
            where.estado = filtros.estado;
        } else {
            where.estado = { not: 'Inactivo' };
        }

        // Si hay filtro por tipo, necesitamos incluir la condición
        const include: any = {
            condicion: true,
        };

        const caracteristicas = await this.prisma.caracteristicaEspecial.findMany({
            where,
            include,
            orderBy: { registradoEn: 'desc' },
        });

        // Filtrar por tipo si se especifica
        let resultado = caracteristicas;
        if (filtros.tipo) {
            resultado = caracteristicas.filter(
                (c: any) => c.condicion.tipo === filtros.tipo
            );
        }

        return resultado.map((c) => this.mapearCaracteristicaEspecial(c));
    }

    async actualizarCondicionPaciente(
        pacienteId: number,
        condicionId: number,
        datos: ActualizarCondicionPacienteDto
    ): Promise<CaracteristicaEspecial> {
        const actualizado = await this.prisma.caracteristicaEspecial.update({
            where: {
                pacienteId_condicionId: {
                    pacienteId,
                    condicionId,
                },
            },
            data: {
                ...datos,
                actualizadoEn: new Date(),
            },
        });
        return this.mapearCaracteristicaEspecial(actualizado);
    }

    async removerCondicionPaciente(
        pacienteId: number,
        condicionId: number
    ): Promise<void> {
        await this.prisma.caracteristicaEspecial.update({
            where: {
                pacienteId_condicionId: {
                    pacienteId,
                    condicionId,
                },
            },
            data: {
                estado: 'Inactivo',
                actualizadoEn: new Date(),
            },
        });
    }

    async existeCondicionPaciente(
        pacienteId: number,
        condicionId: number
    ): Promise<boolean> {
        const count = await this.prisma.caracteristicaEspecial.count({
            where: {
                pacienteId,
                condicionId,
                estado: { not: 'Inactivo' },
            },
        });
        return count > 0;
    }

    // Métodos para Pacientes
    async obtenerAlergias(filtros?: any): Promise<{ datos: CondicionMedica[], total: number }> {
        const alergias = await this.prisma.condicionMedica.findMany({
            where: {
                tipo: 'Alergia',
                estado: 'Activa',
            },
            orderBy: { nombre: 'asc' },
        });

        const datos = alergias.map((a) => this.mapearCondicionMedica(a));

        return {
            datos,
            total: datos.length
        };
    }

    async buscarAlergias(dto: any): Promise<CondicionMedica[]> {
        const where: any = {
            tipo: 'Alergia',
            estado: 'Activa',
            nombre: {
                contains: dto.query,
                mode: 'insensitive',
            },
        };

        const limite = dto.limite || 10;

        const alergias = await this.prisma.condicionMedica.findMany({
            where,
            take: limite,
            orderBy: { nombre: 'asc' },
        });

        return alergias.map((a) => this.mapearCondicionMedica(a));
    }

    async agregarMiAlergia(
        pacienteId: number,
        dto: any
    ): Promise<any> {
        const nueva = await this.prisma.caracteristicaEspecial.create({
            data: {
                pacienteId,
                condicionId: dto.condicionId,
                notas: dto.notas,
                estado: 'Activo',
            },
            include: {
                condicion: true,
            },
        });

        // Retornar la alergia con las notas incluidas
        const resultado = this.mapearCondicionMedica(nueva.condicion);
        (resultado as any).notas = nueva.notas;
        return resultado;
    }

    async crearMiCondicion(pacienteId: number, dto: any): Promise<any> {
        // Usar transacción para crear la condición Y vincularla con el paciente
        const resultado = await this.prisma.$transaction(async (tx) => {
            // 1. Crear condición personal en condiciones_medicas
            const timestamp = Date.now();
            const nombreUnico = `Condición Personal ${timestamp}`;

            const nuevaCondicion = await tx.condicionMedica.create({
                data: {
                    nombre: nombreUnico,
                    descripcion: 'Condición personal del paciente',
                    tipo: 'Condición',
                    estado: 'Activa',
                },
            });

            // 2. Vincular con el paciente en caracteristicas_especiales
            const caracteristica = await tx.caracteristicaEspecial.create({
                data: {
                    pacienteId,
                    condicionId: nuevaCondicion.id,
                    notas: dto.notas, // Las notas del paciente
                    estado: 'Activo',
                },
            });

            return { condicion: nuevaCondicion, caracteristica };
        });

        // Retornar la condición con las notas incluidas
        const condicionMapeada = this.mapearCondicionMedica(resultado.condicion);
        (condicionMapeada as any).notas = resultado.caracteristica.notas;
        return condicionMapeada;
    }

    async obtenerMisCondiciones(
        pacienteId: number,
        filtros: any
    ): Promise<CondicionMedica[]> {
        // Obtener todas las condiciones del paciente desde caracteristicas_especiales
        const where: any = {
            pacienteId,
        };

        if (filtros.estado) {
            // Mapear estado de CondicionMedica (Activa/Inactiva) a CaracteristicaEspecial (Activo/Inactivo)
            const estadoMap: Record<string, string> = {
                'Activa': 'Activo',
                'Inactiva': 'Inactivo'
            };
            where.estado = estadoMap[filtros.estado] || filtros.estado;
        } else {
            where.estado = { not: 'Inactivo' };
        }

        const caracteristicas = await this.prisma.caracteristicaEspecial.findMany({
            where,
            include: {
                condicion: true,
            },
            orderBy: { registradoEn: 'desc' },
        });

        // Filtrar por tipo si se especifica
        let resultado = caracteristicas;
        if (filtros.tipo) {
            resultado = caracteristicas.filter(
                (c: any) => c.condicion.tipo === filtros.tipo
            );
        }

        // Retornar las condiciones médicas con las notas del paciente como campo separado
        return resultado.map((c: any) => {
            const condicion = this.mapearCondicionMedica(c.condicion);
            // Agregar las notas del paciente como campo adicional
            (condicion as any).notas = c.notas || null;
            return condicion;
        });
    }

    async actualizarMiAlergia(
        pacienteId: number,
        condicionId: number,
        dto: any
    ): Promise<CondicionMedica> {
        // Obtener la alergia para verificar que existe y es del tipo correcto
        const condicion = await this.prisma.condicionMedica.findUnique({
            where: { id: condicionId },
        });

        if (!condicion) {
            throw new Error('Alergia no encontrada');
        }

        if (condicion.tipo !== 'Alergia') {
            throw new Error('La condición especificada no es una alergia');
        }

        // Actualizar SOLO las notas en caracteristicas_especiales
        const caracteristica = await this.prisma.caracteristicaEspecial.update({
            where: {
                pacienteId_condicionId: {
                    pacienteId,
                    condicionId,
                },
            },
            data: {
                notas: dto.notas,
                estado: dto.estado || undefined,
                actualizadoEn: new Date(),
            },
        });

        // Retornar la alergia con las notas incluidas
        const resultado = this.mapearCondicionMedica(condicion);
        (resultado as any).notas = caracteristica.notas;
        return resultado;
    }

    async eliminarMiAlergia(
        pacienteId: number,
        condicionId: number
    ): Promise<void> {
        // Verificar que es una alergia
        const condicion = await this.prisma.condicionMedica.findUnique({
            where: { id: condicionId },
        });

        if (!condicion) {
            throw new Error('Alergia no encontrada');
        }

        if (condicion.tipo !== 'Alergia') {
            throw new Error('La condición especificada no es una alergia');
        }

        // Marcar como inactivo en caracteristicas_especiales
        await this.prisma.caracteristicaEspecial.update({
            where: {
                pacienteId_condicionId: {
                    pacienteId,
                    condicionId,
                },
            },
            data: {
                estado: 'Inactivo',
                actualizadoEn: new Date(),
            },
        });
    }

    async actualizarMiCondicion(
        pacienteId: number,
        condicionId: number,
        dto: any
    ): Promise<CondicionMedica> {
        // Obtener la condición para verificar su tipo y retornarla
        const condicion = await this.prisma.condicionMedica.findUnique({
            where: { id: condicionId },
        });

        if (!condicion) {
            throw new Error('Condición no encontrada');
        }

        if (condicion.tipo !== 'Condición') {
            throw new Error('La condición especificada no es una condición personal');
        }

        // Actualizar SOLO las notas en caracteristicas_especiales
        const caracteristica = await this.prisma.caracteristicaEspecial.update({
            where: {
                pacienteId_condicionId: {
                    pacienteId,
                    condicionId,
                },
            },
            data: {
                notas: dto.notas,
                estado: dto.estado || undefined,
                actualizadoEn: new Date(),
            },
        });

        // Retornar la condición con las notas incluidas
        const resultado = this.mapearCondicionMedica(condicion);
        (resultado as any).notas = caracteristica.notas;
        return resultado;
    }

    async eliminarMiCondicion(
        pacienteId: number,
        condicionId: number
    ): Promise<void> {
        // Verificar que es una condición personal
        const condicion = await this.prisma.condicionMedica.findUnique({
            where: { id: condicionId },
        });

        if (!condicion) {
            throw new Error('Condición no encontrada');
        }

        if (condicion.tipo !== 'Condición') {
            throw new Error('La condición especificada no es una condición personal');
        }

        // Marcar como inactivo en caracteristicas_especiales
        await this.prisma.caracteristicaEspecial.update({
            where: {
                pacienteId_condicionId: {
                    pacienteId,
                    condicionId,
                },
            },
            data: {
                estado: 'Inactivo',
                actualizadoEn: new Date(),
            },
        });
    }
}
