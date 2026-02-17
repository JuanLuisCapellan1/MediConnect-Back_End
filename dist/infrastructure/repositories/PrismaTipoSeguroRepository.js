"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaTipoSeguroRepository = void 0;
const TipoSeguro_1 = require("../../domain/entities/TipoSeguro");
class PrismaTipoSeguroRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    // ============================================
    // Admin - CRUD completo
    // ============================================
    async crear(datos) {
        const tipoSeguro = await this.prisma.tipoSeguro.create({
            data: {
                nombre: datos.nombre,
                descripcion: datos.descripcion || null,
                estado: 'Activo',
            },
        });
        return this.mapearTipoSeguro(tipoSeguro);
    }
    async obtenerPorId(id) {
        const tipoSeguro = await this.prisma.tipoSeguro.findUnique({
            where: { id },
        });
        return tipoSeguro ? this.mapearTipoSeguro(tipoSeguro) : null;
    }
    async obtenerTodos(filtros) {
        const pagina = filtros.pagina || 1;
        const limite = filtros.limite || 10;
        const skip = (pagina - 1) * limite;
        const where = {};
        if (filtros.estado) {
            where.estado = filtros.estado;
        }
        if (filtros.busqueda) {
            where.nombre = {
                contains: filtros.busqueda,
                mode: 'insensitive',
            };
        }
        const [tiposSeguros, total] = await Promise.all([
            this.prisma.tipoSeguro.findMany({
                where,
                skip,
                take: limite,
                orderBy: { nombre: 'asc' },
            }),
            this.prisma.tipoSeguro.count({ where }),
        ]);
        return {
            datos: tiposSeguros.map((ts) => this.mapearTipoSeguro(ts)),
            total,
        };
    }
    async actualizar(id, datos) {
        const tipoSeguro = await this.prisma.tipoSeguro.update({
            where: { id },
            data: {
                ...(datos.nombre && { nombre: datos.nombre }),
                ...(datos.descripcion !== undefined && { descripcion: datos.descripcion }),
                ...(datos.estado && { estado: datos.estado }),
            },
        });
        return this.mapearTipoSeguro(tipoSeguro);
    }
    async eliminar(id) {
        await this.prisma.tipoSeguro.update({
            where: { id },
            data: { estado: 'Eliminado' },
        });
    }
    // ============================================
    // Cliente - Solo lectura
    // ============================================
    async obtenerActivos() {
        const tiposSeguros = await this.prisma.tipoSeguro.findMany({
            where: { estado: 'Activo' },
            orderBy: { nombre: 'asc' },
        });
        return tiposSeguros.map((ts) => this.mapearTipoSeguro(ts));
    }
    // ============================================
    // Utilidades
    // ============================================
    async existeNombre(nombre, excluirId) {
        const count = await this.prisma.tipoSeguro.count({
            where: {
                nombre,
                ...(excluirId && { id: { not: excluirId } }),
            },
        });
        return count > 0;
    }
    async verificarEnUso(id) {
        // Verificar en pacientes_seguros
        const pacientesCount = await this.prisma.pacienteSeguro.count({
            where: {
                tipoSeguroId: id,
                estado: 'Activo',
            },
        });
        if (pacientesCount > 0) {
            return true;
        }
        // Verificar en doctores_seguros
        const doctoresCount = await this.prisma.doctorSeguro.count({
            where: {
                tipoSeguroId: id,
                estado: 'Activo',
            },
        });
        return doctoresCount > 0;
    }
    // ============================================
    // Mappers
    // ============================================
    mapearTipoSeguro(tipoSeguro) {
        return new TipoSeguro_1.TipoSeguro(tipoSeguro.id, tipoSeguro.nombre, tipoSeguro.estado, tipoSeguro.creadoEn, tipoSeguro.descripcion);
    }
}
exports.PrismaTipoSeguroRepository = PrismaTipoSeguroRepository;
