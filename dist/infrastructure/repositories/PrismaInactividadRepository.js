"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaInactividadRepository = void 0;
class PrismaInactividadRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async crear(datos) {
        return await this.prisma.periodos_inactividad.create({
            data: {
                id_doctor: datos.doctorId,
                fecha_inicio: datos.fechaInicio,
                fecha_fin: datos.fechaFin,
                motivo: datos.motivo ?? null,
                estado: 'Activo',
            },
        });
    }
    async buscarPorId(id) {
        return await this.prisma.periodos_inactividad.findUnique({
            where: { id_periodo: id },
        });
    }
    async listarPorDoctor(doctorId) {
        return await this.prisma.periodos_inactividad.findMany({
            where: { id_doctor: doctorId },
            orderBy: { fecha_inicio: 'desc' },
        });
    }
    async cancelar(id) {
        return await this.prisma.periodos_inactividad.update({
            where: { id_periodo: id },
            data: { estado: 'Cancelado', actualizado_en: new Date() },
        });
    }
    async buscarSolapantes(doctorId, desde, hasta) {
        return await this.prisma.periodos_inactividad.findMany({
            where: {
                id_doctor: doctorId,
                estado: 'Activo',
                fecha_inicio: { lt: hasta },
                fecha_fin: { gt: desde },
            },
        });
    }
}
exports.PrismaInactividadRepository = PrismaInactividadRepository;
