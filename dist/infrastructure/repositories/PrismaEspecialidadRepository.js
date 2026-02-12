"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaEspecialidadRepository = void 0;
const Especialidad_1 = require("../../domain/entities/Especialidad");
class PrismaEspecialidadRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapearEntidad(data) {
        return new Especialidad_1.Especialidad({
            id: data.id,
            nombre: data.nombre,
            descripcion: data.descripcion,
            estado: data.estado,
            creadoEn: data.creadoEn,
        });
    }
    async crear(datos) {
        const nuevo = await this.prisma.especialidad.create({
            data: {
                nombre: datos.nombre,
                descripcion: datos.descripcion,
                estado: datos.estado || 'Activo',
            },
        });
        return this.mapearEntidad(nuevo);
    }
    async obtenerPorId(id) {
        const encontrado = await this.prisma.especialidad.findUnique({
            where: { id },
        });
        return encontrado ? this.mapearEntidad(encontrado) : null;
    }
    async obtenerTodas(filtros) {
        const pagina = filtros.pagina || 1;
        const limite = filtros.limite || 10;
        const skip = (pagina - 1) * limite;
        const where = {};
        if (filtros.nombre) {
            where.nombre = { contains: filtros.nombre, mode: 'insensitive' };
        }
        if (filtros.estado) {
            where.estado = filtros.estado;
        }
        else {
            where.estado = { not: 'Eliminado' };
        }
        const [datos, total] = await Promise.all([
            this.prisma.especialidad.findMany({
                where,
                skip,
                take: limite,
                orderBy: { nombre: 'asc' },
            }),
            this.prisma.especialidad.count({ where }),
        ]);
        return {
            datos: datos.map((d) => this.mapearEntidad(d)),
            total,
        };
    }
    async actualizar(id, datos) {
        const actualizado = await this.prisma.especialidad.update({
            where: { id },
            data: {
                ...datos,
            },
        });
        return this.mapearEntidad(actualizado);
    }
    async eliminar(id) {
        await this.prisma.especialidad.update({
            where: { id },
            data: { estado: 'Eliminado' },
        });
    }
    async existeNombre(nombre, excluirId) {
        const where = {
            nombre: { equals: nombre, mode: 'insensitive' },
            estado: { not: 'Eliminado' },
        };
        if (excluirId) {
            where.id = { not: excluirId };
        }
        const count = await this.prisma.especialidad.count({ where });
        return count > 0;
    }
}
exports.PrismaEspecialidadRepository = PrismaEspecialidadRepository;
