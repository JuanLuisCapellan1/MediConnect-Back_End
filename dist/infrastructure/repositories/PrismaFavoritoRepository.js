"use strict";
/**
 * PrismaFavoritoRepository.ts
 *
 * Implementación de IFavoritoRepository con Prisma.
 * Gestiona la tabla `doctores_favoritos` (modelo DoctorFavorito en Prisma).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaFavoritoRepository = void 0;
const DoctorFavorito_1 = require("../../domain/entities/DoctorFavorito");
class PrismaFavoritoRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    // ─── Agregar favorito ────────────────────────────────────────────────────
    async agregar(pacienteId, doctorId) {
        const p = this.prisma;
        // Upsert: si ya existe pero está inactivo, lo reactiva
        const fav = await p.doctorFavorito.upsert({
            where: { pacienteId_doctorId: { pacienteId, doctorId } },
            create: { pacienteId, doctorId, estado: 'Activo' },
            update: { estado: 'Activo' },
            include: this._doctorInclude()
        });
        return this.mapToDomain(fav);
    }
    // ─── Eliminar favorito ───────────────────────────────────────────────────
    async eliminar(pacienteId, doctorId) {
        const p = this.prisma;
        await p.doctorFavorito.update({
            where: { pacienteId_doctorId: { pacienteId, doctorId } },
            data: { estado: 'Inactivo' }
        });
    }
    // ─── Listar favoritos del paciente ───────────────────────────────────────
    async listar(pacienteId) {
        const p = this.prisma;
        const favs = await p.doctorFavorito.findMany({
            where: { pacienteId, estado: 'Activo' },
            include: this._doctorInclude(),
            orderBy: { agregadoEn: 'desc' }
        });
        return favs.map((f) => this.mapToDomain(f));
    }
    // ─── Verificar existencia ────────────────────────────────────────────────
    async existe(pacienteId, doctorId) {
        const p = this.prisma;
        const count = await p.doctorFavorito.count({
            where: { pacienteId, doctorId, estado: 'Activo' }
        });
        return count > 0;
    }
    // ─── Obtener IDs de doctores favoritos del paciente (para flag cercanos) ─
    async obtenerDoctorIdsDePackient(pacienteId) {
        const p = this.prisma;
        const favs = await p.doctorFavorito.findMany({
            where: { pacienteId, estado: 'Activo' },
            select: { doctorId: true }
        });
        return new Set(favs.map((f) => f.doctorId));
    }
    // ─── Helpers ─────────────────────────────────────────────────────────────
    _doctorInclude() {
        return {
            doctor: {
                select: {
                    usuarioId: true,
                    nombre: true,
                    apellido: true,
                    calificacionPromedio: true,
                    usuario: { select: { fotoPerfil: true } },
                    especialidades: {
                        where: { estado: 'Activo' },
                        select: {
                            es_principal: true,
                            especialidades: { select: { id: true, nombre: true } }
                        }
                    }
                }
            }
        };
    }
    mapToDomain(f) {
        const d = f.doctor;
        return new DoctorFavorito_1.DoctorFavorito(f.pacienteId, f.doctorId, f.agregadoEn, f.estado, d ? {
            usuarioId: d.usuarioId,
            nombre: d.nombre,
            apellido: d.apellido,
            calificacionPromedio: d.calificacionPromedio != null ? Number(d.calificacionPromedio) : null,
            usuario: d.usuario,
            especialidades: (d.especialidades ?? []).map((e) => ({
                id: e.especialidades?.id,
                nombre: e.especialidades?.nombre,
                esPrincipal: e.es_principal
            }))
        } : undefined);
    }
}
exports.PrismaFavoritoRepository = PrismaFavoritoRepository;
