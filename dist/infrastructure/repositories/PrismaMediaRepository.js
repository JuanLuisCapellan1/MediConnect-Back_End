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
exports.PrismaMediaRepository = void 0;
const tsyringe_1 = require("tsyringe");
const client_1 = require("@prisma/client");
const Media_1 = require("../../domain/entities/Media");
let PrismaMediaRepository = class PrismaMediaRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async crear(media) {
        const mediaCreada = await this.prisma.media.create({
            data: {
                archivo: media.archivo,
                nombre: media.nombre,
                tipoMime: media.tipoMime,
                tamanioBytes: media.tamanioBytes,
                estado: media.estado
            }
        });
        return this.mapearAEntidad(mediaCreada);
    }
    async obtenerPorId(id) {
        const media = await this.prisma.media.findUnique({
            where: { id }
        });
        return media ? this.mapearAEntidad(media) : null;
    }
    async obtenerTodos(filtros) {
        const where = {
            estado: 'Activo'
        };
        if (filtros.tipoMime) {
            where.tipoMime = {
                contains: filtros.tipoMime
            };
        }
        const mediaList = await this.prisma.media.findMany({
            where,
            orderBy: { fechaSubida: 'desc' },
            take: filtros.limite || 50,
            skip: filtros.offset || 0
        });
        return mediaList.map(m => this.mapearAEntidad(m));
    }
    async actualizar(id, datos) {
        try {
            const mediaActualizada = await this.prisma.media.update({
                where: { id },
                data: {
                    nombre: datos.nombre,
                    estado: datos.estado
                }
            });
            return this.mapearAEntidad(mediaActualizada);
        }
        catch (error) {
            return null;
        }
    }
    async eliminar(id) {
        try {
            // Soft delete
            await this.prisma.media.update({
                where: { id },
                data: { estado: 'Eliminado' }
            });
            return true;
        }
        catch (error) {
            console.error('Error al eliminar media:', error);
            return false;
        }
    }
    async contarPorTipo(tipoMime) {
        return await this.prisma.media.count({
            where: {
                tipoMime: {
                    contains: tipoMime
                },
                estado: 'Activo'
            }
        });
    }
    mapearAEntidad(data) {
        return new Media_1.Media(data.id, data.archivo, data.nombre, data.tipoMime, data.tamanioBytes, data.estado, data.fechaSubida);
    }
};
exports.PrismaMediaRepository = PrismaMediaRepository;
exports.PrismaMediaRepository = PrismaMediaRepository = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('PrismaClient')),
    __metadata("design:paramtypes", [client_1.PrismaClient])
], PrismaMediaRepository);
