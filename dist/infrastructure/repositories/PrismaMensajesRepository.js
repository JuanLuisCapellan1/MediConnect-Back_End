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
exports.PrismaMensajesRepository = void 0;
const tsyringe_1 = require("tsyringe");
const client_1 = require("@prisma/client");
const Mensaje_1 = require("../../domain/entities/Mensaje");
let PrismaMensajesRepository = class PrismaMensajesRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async crear(mensaje) {
        const mensajeCreado = await this.prisma.mensaje.create({
            data: {
                conversacionId: mensaje.conversacionId,
                remitenteId: mensaje.remitenteId,
                contenido: mensaje.contenido,
                tipo: mensaje.tipo.toLowerCase(), // Normalizar a minúsculas
                mediaId: mensaje.mediaId,
                estado: mensaje.estado
            }
        });
        // Actualizar timestamp de la conversación
        await this.prisma.conversacion.update({
            where: { id: mensaje.conversacionId },
            data: { actualizadoEn: new Date() }
        });
        return this.mapearAEntidad(mensajeCreado);
    }
    async obtenerPorId(id) {
        const mensaje = await this.prisma.mensaje.findUnique({
            where: { id }
        });
        return mensaje ? this.mapearAEntidad(mensaje) : null;
    }
    async obtenerPorConversacion(filtros) {
        // Verificar que el usuario tenga acceso a la conversación
        const conversacion = await this.prisma.conversacion.findFirst({
            where: {
                id: filtros.conversacionId,
                OR: [
                    { emisorId: filtros.usuarioId },
                    { receptorId: filtros.usuarioId }
                ]
            }
        });
        if (!conversacion) {
            throw new Error('No tienes acceso a esta conversación');
        }
        const where = {
            conversacionId: filtros.conversacionId,
            estado: { not: 'Eliminado' }
        };
        if (filtros.tipo) {
            where.tipo = filtros.tipo;
        }
        if (filtros.busqueda) {
            where.contenido = {
                contains: filtros.busqueda,
                mode: 'insensitive'
            };
        }
        if (filtros.antesDeId) {
            where.id = { lt: filtros.antesDeId };
        }
        const mensajes = await this.prisma.mensaje.findMany({
            where,
            include: {
                remitente: {
                    select: {
                        id: true,
                        fotoPerfil: true,
                        paciente: {
                            select: {
                                nombre: true,
                                apellido: true
                            }
                        },
                        doctor: {
                            select: {
                                nombre: true,
                                apellido: true
                            }
                        }
                    }
                },
                media: {
                    select: {
                        id: true,
                        archivo: true,
                        nombre: true,
                        tipoMime: true,
                        tamanioBytes: true
                    }
                }
            },
            orderBy: { enviadoEn: 'desc' },
            take: filtros.limite || 50,
            skip: filtros.offset || 0
        });
        return mensajes.map(m => ({
            id: m.id,
            conversacionId: m.conversacionId,
            remitenteId: m.remitenteId,
            contenido: m.contenido || undefined,
            tipo: m.tipo,
            mediaId: m.mediaId || undefined,
            estado: m.estado,
            enviadoEn: m.enviadoEn,
            remitente: {
                id: m.remitente.id,
                nombre: m.remitente.paciente?.nombre || m.remitente.doctor?.nombre || 'Sin nombre',
                apellido: m.remitente.paciente?.apellido || m.remitente.doctor?.apellido || '',
                fotoPerfil: m.remitente.fotoPerfil || undefined
            },
            media: m.media ? {
                id: m.media.id,
                archivo: m.media.archivo,
                nombre: m.media.nombre || undefined,
                tipoMime: m.media.tipoMime || undefined,
                tamanioBytes: m.media.tamanioBytes ? Number(m.media.tamanioBytes) : undefined
            } : undefined,
            esPropio: m.remitenteId === filtros.usuarioId
        }));
    }
    async actualizar(id, datos) {
        try {
            const mensajeActualizado = await this.prisma.mensaje.update({
                where: { id },
                data: {
                    contenido: datos.contenido
                }
            });
            return this.mapearAEntidad(mensajeActualizado);
        }
        catch (error) {
            return null;
        }
    }
    async eliminar(id, remitenteId) {
        try {
            // Verificar que el mensaje pertenece al remitente
            const mensaje = await this.prisma.mensaje.findFirst({
                where: { id, remitenteId }
            });
            if (!mensaje) {
                return false;
            }
            // Soft delete: cambiar estado a Eliminado y limpiar contenido
            await this.prisma.mensaje.update({
                where: { id },
                data: {
                    estado: 'Eliminado',
                    contenido: null
                }
            });
            return true;
        }
        catch (error) {
            console.error('Error al eliminar mensaje:', error);
            return false;
        }
    }
    async contarPorConversacion(conversacionId) {
        return await this.prisma.mensaje.count({
            where: {
                conversacionId,
                estado: { not: 'Eliminado' }
            }
        });
    }
    async contarNoLeidosPorConversacion(conversacionId, usuarioId) {
        // Obtener el último mensaje leído por el usuario
        const lectura = await this.prisma.lecturaConversacion.findUnique({
            where: {
                conversacionId_usuarioId: {
                    conversacionId,
                    usuarioId
                }
            }
        });
        return await this.prisma.mensaje.count({
            where: {
                conversacionId,
                remitenteId: { not: usuarioId },
                estado: { not: 'Eliminado' },
                id: lectura?.ultimoMensajeLeidoId
                    ? { gt: lectura.ultimoMensajeLeidoId }
                    : undefined
            }
        });
    }
    async obtenerUltimoPorConversacion(conversacionId) {
        const mensaje = await this.prisma.mensaje.findFirst({
            where: {
                conversacionId,
                estado: { not: 'Eliminado' }
            },
            orderBy: { enviadoEn: 'desc' }
        });
        return mensaje ? this.mapearAEntidad(mensaje) : null;
    }
    async buscarEnConversacion(conversacionId, busqueda, limite = 20) {
        const mensajes = await this.prisma.mensaje.findMany({
            where: {
                conversacionId,
                contenido: {
                    contains: busqueda,
                    mode: 'insensitive'
                },
                estado: { not: 'Eliminado' }
            },
            include: {
                remitente: {
                    select: {
                        id: true,
                        fotoPerfil: true,
                        paciente: {
                            select: {
                                nombre: true,
                                apellido: true
                            }
                        },
                        doctor: {
                            select: {
                                nombre: true,
                                apellido: true
                            }
                        }
                    }
                },
                media: {
                    select: {
                        id: true,
                        archivo: true,
                        nombre: true,
                        tipoMime: true,
                        tamanioBytes: true
                    }
                }
            },
            orderBy: { enviadoEn: 'desc' },
            take: limite
        });
        return mensajes.map(m => ({
            id: m.id,
            conversacionId: m.conversacionId,
            remitenteId: m.remitenteId,
            contenido: m.contenido || undefined,
            tipo: m.tipo,
            mediaId: m.mediaId || undefined,
            estado: m.estado,
            enviadoEn: m.enviadoEn,
            remitente: {
                id: m.remitente.id,
                nombre: m.remitente.paciente?.nombre || m.remitente.doctor?.nombre || 'Sin nombre',
                apellido: m.remitente.paciente?.apellido || m.remitente.doctor?.apellido || '',
                fotoPerfil: m.remitente.fotoPerfil || undefined
            },
            media: m.media ? {
                id: m.media.id,
                archivo: m.media.archivo,
                nombre: m.media.nombre || undefined,
                tipoMime: m.media.tipoMime || undefined,
                tamanioBytes: m.media.tamanioBytes ? Number(m.media.tamanioBytes) : undefined
            } : undefined
        }));
    }
    async obtenerConRemitentesPorId(id) {
        const mensaje = await this.prisma.mensaje.findUnique({
            where: { id },
            include: {
                remitente: {
                    select: {
                        id: true,
                        fotoPerfil: true,
                        paciente: {
                            select: {
                                nombre: true,
                                apellido: true
                            }
                        },
                        doctor: {
                            select: {
                                nombre: true,
                                apellido: true
                            }
                        }
                    }
                },
                media: {
                    select: {
                        id: true,
                        archivo: true,
                        nombre: true,
                        tipoMime: true,
                        tamanioBytes: true
                    }
                }
            }
        });
        if (!mensaje)
            return null;
        return {
            id: mensaje.id,
            conversacionId: mensaje.conversacionId,
            remitenteId: mensaje.remitenteId,
            contenido: mensaje.contenido || undefined,
            tipo: mensaje.tipo,
            mediaId: mensaje.mediaId || undefined,
            estado: mensaje.estado,
            enviadoEn: mensaje.enviadoEn,
            remitente: {
                id: mensaje.remitente.id,
                nombre: mensaje.remitente.paciente?.nombre || mensaje.remitente.doctor?.nombre || 'Sin nombre',
                apellido: mensaje.remitente.paciente?.apellido || mensaje.remitente.doctor?.apellido || '',
                fotoPerfil: mensaje.remitente.fotoPerfil || undefined
            },
            media: mensaje.media ? {
                id: mensaje.media.id,
                archivo: mensaje.media.archivo,
                nombre: mensaje.media.nombre || undefined,
                tipoMime: mensaje.media.tipoMime || undefined,
                tamanioBytes: mensaje.media.tamanioBytes ? Number(mensaje.media.tamanioBytes) : undefined
            } : undefined
        };
    }
    mapearAEntidad(data) {
        return new Mensaje_1.Mensaje(data.id, data.conversacionId, data.remitenteId, data.contenido, data.tipo, data.mediaId, data.estado, data.enviadoEn);
    }
};
exports.PrismaMensajesRepository = PrismaMensajesRepository;
exports.PrismaMensajesRepository = PrismaMensajesRepository = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('PrismaClient')),
    __metadata("design:paramtypes", [client_1.PrismaClient])
], PrismaMensajesRepository);
