/**
 * PrismaFavoritoRepository.ts
 *
 * Implementación de IFavoritoRepository con Prisma.
 * Gestiona la tabla `doctores_favoritos` (modelo DoctorFavorito en Prisma).
 */

import { PrismaClient } from '@prisma/client';
import { DoctorFavorito } from '../../domain/entities/DoctorFavorito';
import { IFavoritoRepository } from '../../domain/repositories/IFavoritoRepository';

export class PrismaFavoritoRepository implements IFavoritoRepository {
    constructor(private readonly prisma: PrismaClient) { }

    // ─── Agregar favorito ────────────────────────────────────────────────────
    async agregar(pacienteId: number, doctorId: number): Promise<DoctorFavorito> {
        const p = this.prisma as any;

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
    async eliminar(pacienteId: number, doctorId: number): Promise<void> {
        const p = this.prisma as any;
        await p.doctorFavorito.update({
            where: { pacienteId_doctorId: { pacienteId, doctorId } },
            data: { estado: 'Inactivo' }
        });
    }

    // ─── Listar favoritos del paciente ───────────────────────────────────────
    async listar(pacienteId: number): Promise<DoctorFavorito[]> {
        const p = this.prisma as any;
        const favs = await p.doctorFavorito.findMany({
            where: { pacienteId, estado: 'Activo' },
            include: this._doctorInclude(),
            orderBy: { agregadoEn: 'desc' }
        });
        return favs.map((f: any) => this.mapToDomain(f));
    }

    // ─── Verificar existencia ────────────────────────────────────────────────
    async existe(pacienteId: number, doctorId: number): Promise<boolean> {
        const p = this.prisma as any;
        const count = await p.doctorFavorito.count({
            where: { pacienteId, doctorId, estado: 'Activo' }
        });
        return count > 0;
    }

    // ─── Obtener IDs de doctores favoritos del paciente (para flag cercanos) ─
    async obtenerDoctorIdsDePackient(pacienteId: number): Promise<Set<number>> {
        const p = this.prisma as any;
        const favs = await p.doctorFavorito.findMany({
            where: { pacienteId, estado: 'Activo' },
            select: { doctorId: true }
        });
        return new Set(favs.map((f: any) => f.doctorId));
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────
    private _doctorInclude() {
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

    private mapToDomain(f: any): DoctorFavorito {
        const d = f.doctor;
        return new DoctorFavorito(
            f.pacienteId,
            f.doctorId,
            f.agregadoEn,
            f.estado,
            d ? {
                usuarioId: d.usuarioId,
                nombre: d.nombre,
                apellido: d.apellido,
                calificacionPromedio: d.calificacionPromedio != null ? Number(d.calificacionPromedio) : null,
                usuario: d.usuario,
                especialidades: (d.especialidades ?? []).map((e: any) => ({
                    id: e.especialidades?.id,
                    nombre: e.especialidades?.nombre,
                    esPrincipal: e.es_principal
                }))
            } : undefined
        );
    }
}
