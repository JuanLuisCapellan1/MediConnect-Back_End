"use strict";
/**
 * PrismaGrupoCitaRepository.ts
 * Repositorio para grupos de citas recurrentes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaGrupoCitaRepository = void 0;
const GrupoCita_1 = require("../../domain/entities/GrupoCita");
const GRUPO_INCLUDE = {
    citas: {
        orderBy: { fechaInicio: 'asc' },
        select: {
            id: true,
            fechaInicio: true,
            fechaFin: true,
            estado: true,
            horarioId: true,
            modalidad: true,
            totalAPagar: true,
        }
    }
};
class PrismaGrupoCitaRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async crear(datos) {
        const creado = await this.prisma.grupos_citas.create({
            data: {
                id_paciente: datos.pacienteId,
                id_servicio: datos.servicioId,
                id_horario: datos.horarioId,
                fecha_inicio: datos.fechaInicio,
                fecha_fin: datos.fechaFin ?? null,
                descripcion: datos.descripcion ?? null,
                estado: 'Activo'
            },
            include: GRUPO_INCLUDE
        });
        return this.mapToDomain(creado);
    }
    async buscarPorId(id) {
        const grupo = await this.prisma.grupos_citas.findUnique({
            where: { id_grupo: id },
            include: GRUPO_INCLUDE
        });
        if (!grupo)
            return null;
        return this.mapToDomain(grupo);
    }
    async listarPorPaciente(pacienteId, pagina = 1, limite = 10) {
        const skip = (pagina - 1) * limite;
        const where = { id_paciente: pacienteId };
        const [datos, total] = await Promise.all([
            this.prisma.grupos_citas.findMany({
                where,
                include: GRUPO_INCLUDE,
                orderBy: { creado_en: 'desc' },
                skip,
                take: limite
            }),
            this.prisma.grupos_citas.count({ where })
        ]);
        return { datos: datos.map((g) => this.mapToDomain(g)), total };
    }
    async cancelarGrupo(grupoId) {
        // Desactivar el grupo y cancelar todas sus citas pendientes en transacción
        const resultado = await this.prisma.$transaction(async (tx) => {
            await tx.cita.updateMany({
                where: {
                    id_grupo: grupoId,
                    estado: { in: ['Programada', 'Reprogramada'] }
                },
                data: {
                    estado: 'Cancelada',
                    motivoCancelacion: 'Grupo de citas cancelado',
                    actualizadoEn: new Date()
                }
            });
            return await tx.grupos_citas.update({
                where: { id_grupo: grupoId },
                data: { estado: 'Cancelado' },
                include: GRUPO_INCLUDE
            });
        });
        return this.mapToDomain(resultado);
    }
    mapToDomain(g) {
        return new GrupoCita_1.GrupoCita(g.id_grupo, g.id_paciente, g.id_servicio, g.id_horario, g.fecha_inicio, g.fecha_fin ?? null, g.estado, g.creado_en, g.descripcion ?? null, g.citas ?? []);
    }
}
exports.PrismaGrupoCitaRepository = PrismaGrupoCitaRepository;
