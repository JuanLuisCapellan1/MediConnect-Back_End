"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaCentroSaludRepository = void 0;
class PrismaCentroSaludRepository {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    // ─── Nuevos métodos ────────────────────────────────────────────────────────
    async obtenerPerfilCompleto(usuarioId) {
        return await this.prisma.centroSalud.findUnique({
            where: { usuarioId },
            include: {
                usuario: {
                    select: { id: true, email: true, telefono: true, fotoPerfil: true, emailVerificado: true }
                },
                tipoCentro: true,
                ubicacion: {
                    include: {
                        barrio: {
                            include: { seccion: true }
                        },
                        subBarrio: true,
                    }
                },
            }
        });
    }
    async actualizarPerfil(usuarioId, datos) {
        const dataUpdate = { actualizadoEn: new Date() };
        if (datos.nombreComercial !== undefined)
            dataUpdate.nombreComercial = datos.nombreComercial;
        if (datos.rnc !== undefined)
            dataUpdate.rnc = datos.rnc;
        if (datos.tipoCentroId !== undefined)
            dataUpdate.tipoCentroId = datos.tipoCentroId;
        if (datos.sitio_web !== undefined)
            dataUpdate.sitio_web = datos.sitio_web;
        if (datos.descripcion !== undefined)
            dataUpdate.descripcion = datos.descripcion;
        return await this.prisma.centroSalud.update({
            where: { usuarioId },
            data: dataUpdate,
            include: {
                usuario: { select: { id: true, email: true, telefono: true, fotoPerfil: true } },
                tipoCentro: true,
                ubicacion: { include: { barrio: { include: { seccion: true } }, subBarrio: true } }
            }
        });
    }
    async actualizarFotoPerfil(usuarioId, url) {
        return await this.prisma.centroSalud.update({
            where: { usuarioId },
            data: { foto_perfil: url, actualizadoEn: new Date() },
            include: {
                usuario: { select: { id: true, email: true, fotoPerfil: true } },
                tipoCentro: true,
                ubicacion: true,
            }
        });
    }
    async obtenerUbicacion(usuarioId) {
        const centro = await this.prisma.centroSalud.findUnique({
            where: { usuarioId },
            include: {
                ubicacion: {
                    include: {
                        barrio: { include: { seccion: true } },
                        subBarrio: true,
                    }
                }
            }
        });
        return centro?.ubicacion ?? null;
    }
    async actualizarUbicacion(usuarioId, datos) {
        const centro = await this.prisma.centroSalud.findUnique({
            where: { usuarioId },
            select: { ubicacionId: true }
        });
        if (!centro)
            throw new Error('Centro de salud no encontrado');
        const dataUpdate = {};
        if (datos.barrioId !== undefined)
            dataUpdate.barrioId = datos.barrioId;
        if (datos.subBarrioId !== undefined)
            dataUpdate.subBarrioId = datos.subBarrioId;
        if (datos.direccion !== undefined)
            dataUpdate.direccion = datos.direccion;
        if (datos.codigoPostal !== undefined)
            dataUpdate.codigoPostal = datos.codigoPostal;
        return await this.prisma.ubicacion.update({
            where: { id: centro.ubicacionId },
            data: dataUpdate,
            include: {
                barrio: { include: { seccion: true } },
                subBarrio: true,
            }
        });
    }
    async listarDoctoresAsociados(centroSaludId) {
        const solicitudes = await this.prisma.solicitudAlianza.findMany({
            where: { centroSaludId, estado: 'Aceptada' },
            include: {
                doctor: {
                    include: {
                        usuario: {
                            select: { email: true, telefono: true, fotoPerfil: true }
                        },
                        especialidades: {
                            select: { id_especialidad: true, es_principal: true }
                        },
                        servicios: {
                            where: { estado: 'Activo' },
                            select: { id: true, nombre: true, precio: true }
                        }
                    }
                }
            },
            orderBy: { actualizadoEn: 'desc' }
        });
        return solicitudes.map((s) => ({
            solicitudId: s.id,
            aliadoDesde: s.actualizadoEn ?? s.creadoEn,
            doctor: s.doctor
        }));
    }
    // ─── Métodos legacy ────────────────────────────────────────────────────────
    async obtenerPorId(usuarioId) {
        return await this.prisma.centroSalud.findUnique({
            where: { usuarioId },
            include: { usuario: true, tipoCentro: true, ubicacion: true },
        });
    }
    async obtenerPorUsuarioId(usuarioId) {
        return await this.obtenerPorId(usuarioId);
    }
    async crear(datos) {
        return await this.prisma.centroSalud.create({
            data: datos,
            include: { usuario: true, tipoCentro: true, ubicacion: true },
        });
    }
    async actualizar(usuarioId, datos) {
        return await this.prisma.centroSalud.update({
            where: { usuarioId },
            data: datos,
            include: { usuario: true, tipoCentro: true, ubicacion: true },
        });
    }
    async listar() {
        return await this.prisma.centroSalud.findMany({
            include: { usuario: true, tipoCentro: true, ubicacion: true },
        });
    }
}
exports.PrismaCentroSaludRepository = PrismaCentroSaludRepository;
