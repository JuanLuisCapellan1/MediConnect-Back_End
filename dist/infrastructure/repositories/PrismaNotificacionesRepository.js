"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaNotificacionesRepository = void 0;
const tsyringe_1 = require("tsyringe");
const client_1 = require("@prisma/client");
const Notificacion_1 = require("../../domain/entities/Notificacion");
let PrismaNotificacionesRepository = class PrismaNotificacionesRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async crear(notificacion) {
        const notificacionCreada = await this.prisma.notificacion.create({
            data: {
                usuarioId: notificacion.usuarioId,
                titulo: notificacion.titulo,
                mensaje: notificacion.mensaje,
                tipoAlerta: notificacion.tipoAlerta,
                tipoEntidad: notificacion.tipoEntidad,
                entidadId: notificacion.entidadId,
                estado: notificacion.estado
            }
        });
        return this.mapearAEntidad(notificacionCreada);
    }
    async obtenerPorId(id) {
        const notificacion = await this.prisma.notificacion.findUnique({
            where: { id }
        });
        return notificacion ? this.mapearAEntidad(notificacion) : null;
    }
    async obtenerPorUsuario(filtros) {
        const where = {
            usuarioId: filtros.usuarioId,
            estado: 'Activo'
        };
        // Filtrar por leídas/no leídas
        if (filtros.leidas !== undefined) {
            where.leidaEn = filtros.leidas ? { not: null } : null;
        }
        // Filtrar por tipo de alerta
        if (filtros.tipoAlerta) {
            where.tipoAlerta = filtros.tipoAlerta;
        }
        // Filtrar por tipo de entidad
        if (filtros.tipoEntidad) {
            where.tipoEntidad = filtros.tipoEntidad;
        }
        const notificaciones = await this.prisma.notificacion.findMany({
            where,
            orderBy: { creadoEn: 'desc' },
            take: filtros.limite || 50,
            skip: filtros.offset || 0
        });
        return notificaciones.map(n => this.mapearAEntidad(n));
    }
    async contarNoLeidas(usuarioId) {
        return await this.prisma.notificacion.count({
            where: {
                usuarioId,
                leidaEn: null,
                estado: 'Activo'
            }
        });
    }
    async marcarComoLeida(id, usuarioId) {
        try {
            const notificacionActualizada = await this.prisma.notificacion.update({
                where: {
                    id,
                    usuarioId // Asegurar que solo el usuario dueño pueda marcarla
                },
                data: {
                    leidaEn: new Date()
                }
            });
            return this.mapearAEntidad(notificacionActualizada);
        }
        catch (error) {
            // Si no encuentra la notificación o no pertenece al usuario
            return null;
        }
    }
    async marcarVariasComoLeidas(ids, usuarioId) {
        const resultado = await this.prisma.notificacion.updateMany({
            where: {
                id: { in: ids },
                usuarioId,
                leidaEn: null // Solo marcar las que no han sido leídas
            },
            data: {
                leidaEn: new Date()
            }
        });
        return resultado.count;
    }
    async marcarTodasComoLeidas(usuarioId) {
        const resultado = await this.prisma.notificacion.updateMany({
            where: {
                usuarioId,
                leidaEn: null,
                estado: 'Activo'
            },
            data: {
                leidaEn: new Date()
            }
        });
        return resultado.count;
    }
    async eliminar(id, usuarioId) {
        try {
            await this.prisma.notificacion.update({
                where: {
                    id,
                    usuarioId
                },
                data: {
                    estado: 'Inactivo'
                }
            });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async eliminarVarias(ids, usuarioId) {
        const resultado = await this.prisma.notificacion.updateMany({
            where: {
                id: { in: ids },
                usuarioId
            },
            data: {
                estado: 'Inactivo'
            }
        });
        return resultado.count;
    }
    mapearAEntidad(data) {
        return new Notificacion_1.Notificacion(data.id, data.usuarioId, data.titulo, data.mensaje, data.tipoAlerta, data.tipoEntidad, data.entidadId, data.leidaEn, data.estado, data.creadoEn);
    }
};
exports.PrismaNotificacionesRepository = PrismaNotificacionesRepository;
exports.PrismaNotificacionesRepository = PrismaNotificacionesRepository = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('PrismaClient')),
    __metadata("design:paramtypes", [client_1.PrismaClient])
], PrismaNotificacionesRepository);
