"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaDoctorIdiomaRepository = void 0;
const DoctorIdioma_1 = require("../../domain/entities/DoctorIdioma");
class PrismaDoctorIdiomaRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapearEntidad(data) {
        return new DoctorIdioma_1.DoctorIdioma(data.id, data.doctorId, data.nombre, data.nivel, data.estado, data.creadoEn, data.actualizadoEn);
    }
    async agregar(doctorId, dto) {
        const idioma = await this.prisma.doctorIdioma.create({
            data: {
                doctorId,
                nombre: dto.nombre,
                nivel: dto.nivel || 'Intermedio',
                estado: 'Activo',
            },
        });
        return this.mapearEntidad(idioma);
    }
    async obtenerPorId(id) {
        const idioma = await this.prisma.doctorIdioma.findUnique({
            where: { id },
        });
        return idioma ? this.mapearEntidad(idioma) : null;
    }
    async obtenerPorDoctorId(doctorId) {
        const idiomas = await this.prisma.doctorIdioma.findMany({
            where: {
                doctorId,
                estado: 'Activo',
            },
            orderBy: {
                creadoEn: 'desc',
            },
        });
        return idiomas.map((i) => this.mapearEntidad(i));
    }
    async actualizar(id, dto) {
        const dataToUpdate = {};
        if (dto.nombre !== undefined)
            dataToUpdate.nombre = dto.nombre;
        if (dto.nivel !== undefined)
            dataToUpdate.nivel = dto.nivel;
        dataToUpdate.actualizadoEn = new Date();
        const idioma = await this.prisma.doctorIdioma.update({
            where: { id },
            data: dataToUpdate,
        });
        return this.mapearEntidad(idioma);
    }
    async eliminar(id) {
        await this.prisma.doctorIdioma.delete({
            where: { id },
        });
    }
}
exports.PrismaDoctorIdiomaRepository = PrismaDoctorIdiomaRepository;
