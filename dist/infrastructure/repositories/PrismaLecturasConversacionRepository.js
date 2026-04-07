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
exports.PrismaLecturasConversacionRepository = void 0;
const tsyringe_1 = require("tsyringe");
const client_1 = require("@prisma/client");
const LecturaConversacion_1 = require("../../domain/entities/LecturaConversacion");
let PrismaLecturasConversacionRepository = class PrismaLecturasConversacionRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async crear(lectura) {
        const lecturaCreada = await this.prisma.lecturaConversacion.create({
            data: {
                conversacionId: lectura.conversacionId,
                usuarioId: lectura.usuarioId,
                ultimoMensajeLeidoId: lectura.ultimoMensajeLeidoId
            }
        });
        return this.mapearAEntidad(lecturaCreada);
    }
    async obtenerPorConversacionYUsuario(conversacionId, usuarioId) {
        const lectura = await this.prisma.lecturaConversacion.findUnique({
            where: {
                conversacionId_usuarioId: {
                    conversacionId,
                    usuarioId
                }
            }
        });
        return lectura ? this.mapearAEntidad(lectura) : null;
    }
    async actualizarUltimoMensajeLeido(dto) {
        // Verificar que el usuario tenga acceso a la conversación
        const conversacion = await this.prisma.conversacion.findFirst({
            where: {
                id: dto.conversacionId,
                OR: [
                    { emisorId: dto.usuarioId },
                    { receptorId: dto.usuarioId }
                ]
            }
        });
        if (!conversacion) {
            throw new Error('No tienes acceso a esta conversación');
        }
        // Verificar que el mensaje existe en la conversación
        const mensaje = await this.prisma.mensaje.findFirst({
            where: {
                id: dto.ultimoMensajeLeidoId,
                conversacionId: dto.conversacionId
            }
        });
        if (!mensaje) {
            throw new Error('Mensaje no encontrado en esta conversación');
        }
        // Usar upsert para crear o actualizar
        const lecturaActualizada = await this.prisma.lecturaConversacion.upsert({
            where: {
                conversacionId_usuarioId: {
                    conversacionId: dto.conversacionId,
                    usuarioId: dto.usuarioId
                }
            },
            update: {
                ultimoMensajeLeidoId: dto.ultimoMensajeLeidoId,
                leidoEn: new Date()
            },
            create: {
                conversacionId: dto.conversacionId,
                usuarioId: dto.usuarioId,
                ultimoMensajeLeidoId: dto.ultimoMensajeLeidoId
            }
        });
        return this.mapearAEntidad(lecturaActualizada);
    }
    async obtenerMensajesNoLeidosPorUsuario(usuarioId) {
        // Obtener todas las conversaciones del usuario
        const conversaciones = await this.prisma.conversacion.findMany({
            where: {
                OR: [
                    { emisorId: usuarioId },
                    { receptorId: usuarioId }
                ],
                estado: 'Activa'
            },
            include: {
                lecturas: {
                    where: { usuarioId }
                }
            }
        });
        const mapaNoLeidos = new Map();
        // Para cada conversación, contar mensajes no leídos
        for (const conv of conversaciones) {
            const lectura = conv.lecturas[0];
            const countNoLeidos = await this.prisma.mensaje.count({
                where: {
                    conversacionId: conv.id,
                    remitenteId: { not: usuarioId },
                    estado: { not: 'Eliminado' },
                    id: lectura?.ultimoMensajeLeidoId
                        ? { gt: lectura.ultimoMensajeLeidoId }
                        : undefined
                }
            });
            if (countNoLeidos > 0) {
                mapaNoLeidos.set(conv.id, countNoLeidos);
            }
        }
        return mapaNoLeidos;
    }
    async eliminarPorConversacion(conversacionId) {
        try {
            await this.prisma.lecturaConversacion.deleteMany({
                where: { conversacionId }
            });
            return true;
        }
        catch (error) {
            console.error('Error al eliminar lecturas de conversación:', error);
            return false;
        }
    }
    mapearAEntidad(data) {
        return new LecturaConversacion_1.LecturaConversacion(data.conversacionId, data.usuarioId, data.ultimoMensajeLeidoId, data.leidoEn);
    }
};
exports.PrismaLecturasConversacionRepository = PrismaLecturasConversacionRepository;
exports.PrismaLecturasConversacionRepository = PrismaLecturasConversacionRepository = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('PrismaClient')),
    __metadata("design:paramtypes", [client_1.PrismaClient])
], PrismaLecturasConversacionRepository);
