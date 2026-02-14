"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaCondicionMedicaRepository = void 0;
const CondicionMedica_1 = require("../../domain/entities/CondicionMedica");
const CaracteristicaEspecial_1 = require("../../domain/entities/CaracteristicaEspecial");
class PrismaCondicionMedicaRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapearCondicionMedica(data) {
        return new CondicionMedica_1.CondicionMedica({
            id: data.id,
            nombre: data.nombre,
            descripcion: data.descripcion,
            tipo: data.tipo,
            estado: data.estado,
            creadoEn: data.creadoEn,
        });
    }
    mapearCaracteristicaEspecial(data) {
        return new CaracteristicaEspecial_1.CaracteristicaEspecial({
            pacienteId: data.pacienteId,
            condicionId: data.condicionId,
            notas: data.notas,
            estado: data.estado,
            creadoPor: data.creadoPor,
            doctorId: data.doctorId,
            registradoEn: data.registradoEn,
            actualizadoEn: data.actualizadoEn,
        });
    }
    // CRUD de Condiciones Médicas
    async crear(datos) {
        const nuevo = await this.prisma.condicionMedica.create({
            data: {
                nombre: datos.nombre,
                descripcion: datos.descripcion,
                tipo: datos.tipo,
            },
        });
        return this.mapearCondicionMedica(nuevo);
    }
    async obtenerPorId(id) {
        const encontrado = await this.prisma.condicionMedica.findUnique({
            where: { id },
        });
        return encontrado ? this.mapearCondicionMedica(encontrado) : null;
    }
    async obtenerTodas(filtros) {
        const pagina = filtros.pagina || 1;
        const limite = filtros.limite || 10;
        const skip = (pagina - 1) * limite;
        const where = {};
        if (filtros.nombre) {
            where.nombre = { contains: filtros.nombre, mode: 'insensitive' };
        }
        if (filtros.tipo) {
            where.tipo = filtros.tipo;
        }
        if (filtros.estado) {
            where.estado = filtros.estado;
        }
        else {
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
    async actualizar(id, datos) {
        const actualizado = await this.prisma.condicionMedica.update({
            where: { id },
            data: {
                ...datos,
            },
        });
        return this.mapearCondicionMedica(actualizado);
    }
    async eliminar(id) {
        await this.prisma.condicionMedica.update({
            where: { id },
            data: { estado: 'Eliminada' },
        });
    }
    async existeNombre(nombre, excluirId) {
        const where = {
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
    async asignarAPaciente(datos) {
        const nueva = await this.prisma.caracteristicaEspecial.create({
            data: {
                pacienteId: datos.pacienteId,
                condicionId: datos.condicionId,
                notas: datos.notas,
                creadoPor: 'Doctor',
                doctorId: datos.doctorId,
            },
        });
        return this.mapearCaracteristicaEspecial(nueva);
    }
    async obtenerCondicionesPaciente(pacienteId, filtros) {
        const where = {
            pacienteId,
        };
        if (filtros.estado) {
            where.estado = filtros.estado;
        }
        else {
            where.estado = { not: 'Inactivo' };
        }
        // Si hay filtro por tipo, necesitamos incluir la condición
        const include = {
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
            resultado = caracteristicas.filter((c) => c.condicion.tipo === filtros.tipo);
        }
        return resultado.map((c) => this.mapearCaracteristicaEspecial(c));
    }
    async actualizarCondicionPaciente(pacienteId, condicionId, datos) {
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
    async removerCondicionPaciente(pacienteId, condicionId) {
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
    async existeCondicionPaciente(pacienteId, condicionId) {
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
    async obtenerAlergias() {
        const alergias = await this.prisma.condicionMedica.findMany({
            where: {
                tipo: 'Alergia',
                estado: 'Activa',
            },
            orderBy: { nombre: 'asc' },
        });
        return alergias.map((a) => this.mapearCondicionMedica(a));
    }
    async buscarAlergias(dto) {
        const where = {
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
    async agregarMiAlergia(pacienteId, dto) {
        const nueva = await this.prisma.caracteristicaEspecial.create({
            data: {
                pacienteId,
                condicionId: dto.condicionId,
                notas: dto.descripcion,
                creadoPor: 'Paciente',
                estado: 'Activo',
            },
        });
        return this.mapearCaracteristicaEspecial(nueva);
    }
    async crearMiCondicion(pacienteId, dto) {
        // Primero, buscar o crear una condición genérica "Condición Personal"
        let condicionPersonal = await this.prisma.condicionMedica.findFirst({
            where: {
                nombre: 'Condición Personal',
                tipo: 'Condición',
            },
        });
        if (!condicionPersonal) {
            condicionPersonal = await this.prisma.condicionMedica.create({
                data: {
                    nombre: 'Condición Personal',
                    descripcion: 'Condición médica reportada por el paciente',
                    tipo: 'Condición',
                    estado: 'Activa',
                },
            });
        }
        // Crear la característica especial con la descripción del paciente
        const nueva = await this.prisma.caracteristicaEspecial.create({
            data: {
                pacienteId,
                condicionId: condicionPersonal.id,
                notas: dto.descripcion,
                creadoPor: 'Paciente',
                estado: 'Activo',
            },
        });
        return this.mapearCaracteristicaEspecial(nueva);
    }
    async obtenerMisCondiciones(pacienteId, filtros) {
        const where = {
            pacienteId,
        };
        if (filtros.estado) {
            where.estado = filtros.estado;
        }
        else {
            where.estado = { not: 'Inactivo' };
        }
        const include = {
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
            resultado = caracteristicas.filter((c) => c.condicion.tipo === filtros.tipo);
        }
        return resultado.map((c) => this.mapearCaracteristicaEspecial(c));
    }
    async actualizarMiCondicion(pacienteId, condicionId, dto) {
        const actualizado = await this.prisma.caracteristicaEspecial.update({
            where: {
                pacienteId_condicionId: {
                    pacienteId,
                    condicionId,
                },
            },
            data: {
                notas: dto.descripcion,
                estado: dto.estado,
                actualizadoEn: new Date(),
            },
        });
        return this.mapearCaracteristicaEspecial(actualizado);
    }
    async eliminarMiCondicion(pacienteId, condicionId) {
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
exports.PrismaCondicionMedicaRepository = PrismaCondicionMedicaRepository;
