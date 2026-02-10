"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaCentroSaludRepository = void 0;
class PrismaCentroSaludRepository {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async obtenerPorId(usuarioId) {
        return await this.prisma.centroSalud.findUnique({
            where: { usuarioId },
            include: {
                usuario: true,
                tipoCentro: true,
                ubicacion: true,
            },
        });
    }
    async obtenerPorUsuarioId(usuarioId) {
        return await this.prisma.centroSalud.findUnique({
            where: { usuarioId },
            include: {
                usuario: true,
                tipoCentro: true,
                ubicacion: true,
            },
        });
    }
    async crear(datos) {
        return await this.prisma.centroSalud.create({
            data: datos,
            include: {
                usuario: true,
                tipoCentro: true,
                ubicacion: true,
            },
        });
    }
    async actualizar(usuarioId, datos) {
        return await this.prisma.centroSalud.update({
            where: { usuarioId },
            data: datos,
            include: {
                usuario: true,
                tipoCentro: true,
                ubicacion: true,
            },
        });
    }
    async listar() {
        return await this.prisma.centroSalud.findMany({
            include: {
                usuario: true,
                tipoCentro: true,
                ubicacion: true,
            },
        });
    }
}
exports.PrismaCentroSaludRepository = PrismaCentroSaludRepository;
