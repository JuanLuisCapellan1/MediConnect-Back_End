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
exports.PrismaConversacionesRepository = void 0;
const tsyringe_1 = require("tsyringe");
const client_1 = require("@prisma/client");
const Conversacion_1 = require("../../domain/entities/Conversacion");
let PrismaConversacionesRepository = class PrismaConversacionesRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async crear(conversacion) {
        const conversacionCreada = await this.prisma.conversacion.create({
            data: {
                emisorId: conversacion.emisorId,
                receptorId: conversacion.receptorId,
                silenciado: conversacion.silenciado,
                estado: conversacion.estado
            }
        });
        return this.mapearAEntidad(conversacionCreada);
    }
    async obtenerPorId(id) {
        const conversacion = await this.prisma.conversacion.findUnique({
            where: { id }
        });
        return conversacion ? this.mapearAEntidad(conversacion) : null;
    }
    async obtenerPorUsuarios(emisorId, receptorId) {
        const conversacion = await this.prisma.conversacion.findFirst({
            where: {
                OR: [
                    { emisorId, receptorId },
                    { emisorId: receptorId, receptorId: emisorId }
                ]
            }
        });
        return conversacion ? this.mapearAEntidad(conversacion) : null;
    }
    async obtenerPorUsuario(filtros) {
        const where = {
            OR: [
                { emisorId: filtros.usuarioId },
                { receptorId: filtros.usuarioId }
            ]
        };
        if (filtros.estado) {
            where.estado = filtros.estado;
        }
        if (filtros.silenciado !== undefined) {
            where.silenciado = filtros.silenciado;
        }
        const conversaciones = await this.prisma.conversacion.findMany({
            where,
            include: {
                emisor: {
                    select: {
                        id: true,
                        email: true,
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
                receptor: {
                    select: {
                        id: true,
                        email: true,
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
                mensajes: {
                    orderBy: { enviadoEn: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        contenido: true,
                        tipo: true,
                        enviadoEn: true,
                        remitenteId: true,
                        estado: true
                    }
                },
                lecturas: {
                    where: { usuarioId: filtros.usuarioId },
                    select: {
                        ultimoMensajeLeidoId: true
                    }
                }
            },
            orderBy: { actualizadoEn: 'desc' },
            take: filtros.limite || 50,
            skip: filtros.offset || 0
        });
        // Contar mensajes no leídos para cada conversación
        const conversacionesConInfo = await Promise.all(conversaciones.map(async (conv) => {
            const otroUsuario = conv.emisorId === filtros.usuarioId ? conv.receptor : conv.emisor;
            const ultimoMensaje = conv.mensajes[0];
            const lectura = conv.lecturas[0];
            // Contar mensajes no leídos
            let mensajesNoLeidos = 0;
            if (ultimoMensaje) {
                mensajesNoLeidos = await this.prisma.mensaje.count({
                    where: {
                        conversacionId: conv.id,
                        remitenteId: { not: filtros.usuarioId },
                        id: lectura?.ultimoMensajeLeidoId
                            ? { gt: lectura.ultimoMensajeLeidoId }
                            : undefined
                    }
                });
            }
            return {
                id: conv.id,
                emisorId: conv.emisorId,
                receptorId: conv.receptorId,
                silenciado: conv.silenciado,
                estado: conv.estado,
                creadoEn: conv.creadoEn,
                actualizadoEn: conv.actualizadoEn || undefined,
                ultimoMensaje: ultimoMensaje ? {
                    id: ultimoMensaje.id,
                    contenido: ultimoMensaje.estado === 'Eliminado' ? undefined : ultimoMensaje.contenido || undefined,
                    tipo: ultimoMensaje.tipo,
                    enviadoEn: ultimoMensaje.enviadoEn,
                    remitenteId: ultimoMensaje.remitenteId
                } : undefined,
                otroUsuario: {
                    id: otroUsuario.id,
                    nombre: otroUsuario.paciente?.nombre || otroUsuario.doctor?.nombre || 'Sin nombre',
                    apellido: otroUsuario.paciente?.apellido || otroUsuario.doctor?.apellido || '',
                    email: otroUsuario.email,
                    fotoPerfil: otroUsuario.fotoPerfil || undefined
                },
                mensajesNoLeidos
            };
        }));
        // Aplicar filtro de búsqueda si existe
        if (filtros.busqueda) {
            const busquedaLower = filtros.busqueda.toLowerCase();
            return conversacionesConInfo.filter(conv => conv.otroUsuario.nombre.toLowerCase().includes(busquedaLower) ||
                conv.otroUsuario.apellido.toLowerCase().includes(busquedaLower) ||
                conv.otroUsuario.email.toLowerCase().includes(busquedaLower));
        }
        return conversacionesConInfo;
    }
    async actualizar(id, datos) {
        try {
            const conversacionActualizada = await this.prisma.conversacion.update({
                where: { id },
                data: {
                    silenciado: datos.silenciado,
                    estado: datos.estado,
                    actualizadoEn: new Date()
                }
            });
            return this.mapearAEntidad(conversacionActualizada);
        }
        catch (error) {
            return null;
        }
    }
    async eliminar(id, usuarioId) {
        try {
            // Verificar que el usuario sea participante
            const conversacion = await this.prisma.conversacion.findFirst({
                where: {
                    id,
                    OR: [
                        { emisorId: usuarioId },
                        { receptorId: usuarioId }
                    ]
                }
            });
            if (!conversacion) {
                return false;
            }
            // Soft delete: marcar conversación como eliminada
            await this.prisma.conversacion.update({
                where: { id },
                data: {
                    estado: 'Eliminada',
                    actualizadoEn: new Date()
                }
            });
            return true;
        }
        catch (error) {
            console.error('Error al eliminar conversación:', error);
            return false;
        }
    }
    async existeConversacionActiva(emisorId, receptorId) {
        const count = await this.prisma.conversacion.count({
            where: {
                OR: [
                    { emisorId, receptorId, estado: 'Activa' },
                    { emisorId: receptorId, receptorId: emisorId, estado: 'Activa' }
                ]
            }
        });
        return count > 0;
    }
    async contarPorUsuario(usuarioId) {
        return await this.prisma.conversacion.count({
            where: {
                OR: [
                    { emisorId: usuarioId },
                    { receptorId: usuarioId }
                ]
            }
        });
    }
    async obtenerConUltimoMensaje(id, usuarioId) {
        const conversacion = await this.prisma.conversacion.findFirst({
            where: {
                id,
                OR: [
                    { emisorId: usuarioId },
                    { receptorId: usuarioId }
                ]
            },
            include: {
                emisor: {
                    select: {
                        id: true,
                        email: true,
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
                receptor: {
                    select: {
                        id: true,
                        email: true,
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
                mensajes: {
                    orderBy: { enviadoEn: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        contenido: true,
                        tipo: true,
                        enviadoEn: true,
                        remitenteId: true,
                        estado: true
                    }
                },
                lecturas: {
                    where: { usuarioId },
                    select: {
                        ultimoMensajeLeidoId: true
                    }
                }
            }
        });
        if (!conversacion) {
            return null;
        }
        const otroUsuario = conversacion.emisorId === usuarioId ? conversacion.receptor : conversacion.emisor;
        const ultimoMensaje = conversacion.mensajes[0];
        const lectura = conversacion.lecturas[0];
        // Contar mensajes no leídos
        let mensajesNoLeidos = 0;
        if (ultimoMensaje) {
            mensajesNoLeidos = await this.prisma.mensaje.count({
                where: {
                    conversacionId: conversacion.id,
                    remitenteId: { not: usuarioId },
                    id: lectura?.ultimoMensajeLeidoId
                        ? { gt: lectura.ultimoMensajeLeidoId }
                        : undefined
                }
            });
        }
        return {
            id: conversacion.id,
            emisorId: conversacion.emisorId,
            receptorId: conversacion.receptorId,
            silenciado: conversacion.silenciado,
            estado: conversacion.estado,
            creadoEn: conversacion.creadoEn,
            actualizadoEn: conversacion.actualizadoEn || undefined,
            ultimoMensaje: ultimoMensaje ? {
                id: ultimoMensaje.id,
                contenido: ultimoMensaje.estado === 'Eliminado' ? undefined : ultimoMensaje.contenido || undefined,
                tipo: ultimoMensaje.tipo,
                enviadoEn: ultimoMensaje.enviadoEn,
                remitenteId: ultimoMensaje.remitenteId
            } : undefined,
            otroUsuario: {
                id: otroUsuario.id,
                nombre: otroUsuario.paciente?.nombre || otroUsuario.doctor?.nombre || 'Sin nombre',
                apellido: otroUsuario.paciente?.apellido || otroUsuario.doctor?.apellido || '',
                email: otroUsuario.email,
                fotoPerfil: otroUsuario.fotoPerfil || undefined
            },
            mensajesNoLeidos
        };
    }
    mapearAEntidad(data) {
        return new Conversacion_1.Conversacion(data.id, data.emisorId, data.receptorId, data.silenciado, data.estado, data.creadoEn, data.actualizadoEn);
    }
};
exports.PrismaConversacionesRepository = PrismaConversacionesRepository;
exports.PrismaConversacionesRepository = PrismaConversacionesRepository = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('PrismaClient')),
    __metadata("design:paramtypes", [client_1.PrismaClient])
], PrismaConversacionesRepository);
