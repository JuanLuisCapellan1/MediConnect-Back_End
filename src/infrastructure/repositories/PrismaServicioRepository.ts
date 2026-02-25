/**
 * PrismaServicioRepository.ts
 *
 * Lógica completa de persistencia para Servicios.
 *
 * Diseño de sedes:
 *   centroSaludId → upsert en servicios_centros_salud + resuelve ubicacionId del centro
 *   ubicacionId   → establece servicios.id_ubicacion + usa directamente en el horario
 */

import { PrismaClient } from '@prisma/client';
import { Servicio } from '../../domain/entities/Servicio';
import { ServicioImagen } from '../../domain/entities/ServicioImagen';
import { IServicioRepository, FiltrosServicio } from '../../domain/repositories/IServicioRepository';
import { RedisCacheService } from '../external-services/RedisCacheService';

// ─── Includes reutilizables ──────────────────────────────────────────────────

const CENTROS_INCLUDE = {
    where: { estado: 'Activo' },
    include: {
        centros_salud: {
            select: {
                usuarioId: true,
                nombreComercial: true,
                foto_perfil: true,
                sitio_web: true,
                descripcion: true,
                ubicacion: { select: { id: true, direccion: true, barrio: { select: { nombre: true } } } }
            }
        }
    }
} as const;

const UBICACIONES_INCLUDE = {
    where: { estado: 'Activo' },
    include: {
        ubicacion: {
            select: {
                id: true,
                direccion: true,
                barrio: { select: { nombre: true } }
            }
        }
    }
} as const;

const HORARIOS_INCLUDE = {
    where: { estado: 'Activo' },
    include: {
        horario: {
            select: {
                id: true,
                nombre: true,
                horaInicio: true,
                horaFin: true,
                centroSaludId: true,
                centroSalud: { select: { usuarioId: true, nombreComercial: true } },
                ubicacion: { select: { id: true, direccion: true, barrio: { select: { nombre: true } } } },
                horarios_dias: { select: { dia_semana: true } }
            }
        }
    }
} as const;

// ─── Helper: "HH:MM" → Date UTC (date parte neutra 1970-01-01) ───────────────
function horaADate(hhmm: string): Date {
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date('1970-01-01T00:00:00Z');
    d.setUTCHours(h, m, 0, 0);
    return d;
}

// ─── Clase ───────────────────────────────────────────────────────────────────

export class PrismaServicioRepository implements IServicioRepository {
    private readonly CACHE_KEY = (doctorId: number) => `servicios:doctor:${doctorId}`;
    private readonly CACHE_TTL = 3600;

    constructor(
        private readonly prisma: PrismaClient,
        private readonly redis: RedisCacheService
    ) { }

    // ─── Crear ──────────────────────────────────────────────────────────────
    async crear(
        doctorId: number,
        tipoServicioId: number,
        especialidadId: number,
        nombre: string,
        descripcion: string | null,
        precio: number,
        duracionMinutos: number,
        sesiones: number,
        maxPacientesDia: number | null,
        modalidad: string,
        centroSaludIds?: number[],
        ubicacionIds?: number[],
        horarioIds?: number[]
    ): Promise<Servicio> {
        const p = this.prisma as any;

        const creado = await p.$transaction(async (tx: any) => {
            // Obtener ubicacionId del perfil del doctor para asignar al campo directo del servicio
            const doctor = await tx.doctor.findUnique({
                where: { usuarioId: doctorId },
                select: { ubicacionId: true }
            });
            const doctorUbicacionId = doctor?.ubicacionId ?? null;

            const servicio = await tx.servicio.create({
                data: {
                    doctorId,
                    tipoServicioId,
                    especialidadId,
                    nombre,
                    descripcion,
                    precio,
                    duracionMinutos,
                    sesiones,
                    maxPacientesDia,
                    modalidad,
                    estado: 'Activo',
                    id_ubicacion: doctorUbicacionId
                }
            });

            // Registrar centros de salud
            if (centroSaludIds?.length) {
                await this._procesarCentros(tx, servicio.id, centroSaludIds);
            }

            // Registrar ubicaciones (tabla puente servicios_ubicaciones)
            if (ubicacionIds?.length) {
                await this._procesarUbicaciones(tx, servicio.id, ubicacionIds);
            }

            // Vincular horarios existentes al servicio
            if (horarioIds?.length) {
                await this._vincularHorarios(tx, servicio.id, doctorId, horarioIds);
            }

            return servicio;
        });

        await this.redis.del(this.CACHE_KEY(doctorId));
        return this.mapToDomain(creado);
    }

    // ─── Buscar por ID ──────────────────────────────────────────────────────
    async buscarPorId(id: number): Promise<Servicio | null> {
        const p = this.prisma as any;
        const s = await p.servicio.findUnique({
            where: { id },
            include: {
                imagenes: { where: { estado: 'Activo' }, orderBy: { orden: 'asc' } },
                doctor: { include: { usuario: { select: { id: true, email: true, fotoPerfil: true } } } },
                especialidad: true,
                tipoServicio: true,
                servicios_ubicaciones: UBICACIONES_INCLUDE,
                servicios_centros_salud: CENTROS_INCLUDE,
                horarios: HORARIOS_INCLUDE
            }
        });
        if (!s) return null;
        return this.mapToDomainCompleto(s);
    }

    // ─── Listar por doctor ──────────────────────────────────────────────────
    async listarPorDoctor(doctorId: number, filtros?: FiltrosServicio): Promise<Servicio[]> {
        const p = this.prisma as any;
        const hayFiltros = filtros && Object.keys(filtros).length > 0;

        if (!hayFiltros) {
            const cached = await this.redis.get(this.CACHE_KEY(doctorId));
            if (cached) {
                try { return (JSON.parse(cached) as any[]).map(s => this.mapToDomainCompleto(s)); }
                catch { /* cache corrupto */ }
            }
        }

        const where = this._buildWhere({ doctorId }, filtros);
        const servicios = await p.servicio.findMany({
            where,
            include: this._listInclude(),
            orderBy: { creadoEn: 'desc' }
        });

        const resultado = servicios.map((s: any) => this.mapToDomainCompleto(s));
        if (!hayFiltros) {
            await this.redis.set(this.CACHE_KEY(doctorId), JSON.stringify(servicios), this.CACHE_TTL);
        }
        return resultado;
    }

    // ─── Listar por centro ──────────────────────────────────────────────────
    async listarPorCentro(centroId: number, filtros?: FiltrosServicio): Promise<Servicio[]> {
        const p = this.prisma as any;
        const whereBase: any = {
            servicios_centros_salud: {
                some: { id_centro_salud: centroId, estado: 'Activo' }
            }
        };
        const where = this._buildWhere(whereBase, filtros);
        const servicios = await p.servicio.findMany({
            where,
            include: this._listInclude(),
            orderBy: { creadoEn: 'desc' }
        });
        return servicios.map((s: any) => this.mapToDomainCompleto(s));
    }

    // ─── Actualizar ─────────────────────────────────────────────────────────
    async actualizar(id: number, datos: any): Promise<Servicio> {
        const p = this.prisma as any;
        const existente = await p.servicio.findUnique({ where: { id } });
        if (!existente) throw new Error(`Servicio con ID ${id} no existe`);

        const doctorId: number = existente.doctorId;

        await p.$transaction(async (tx: any) => {
            const dataUpdate: Record<string, any> = { actualizadoEn: new Date() };
            if (datos.tipoServicioId !== undefined) dataUpdate.tipoServicioId = datos.tipoServicioId;
            if (datos.especialidadId !== undefined) dataUpdate.especialidadId = datos.especialidadId;
            if (datos.nombre !== undefined) dataUpdate.nombre = datos.nombre;
            if (datos.descripcion !== undefined) dataUpdate.descripcion = datos.descripcion;
            if (datos.precio !== undefined) dataUpdate.precio = datos.precio;
            if (datos.duracionMinutos !== undefined) dataUpdate.duracionMinutos = datos.duracionMinutos;
            if (datos.sesiones !== undefined) dataUpdate.sesiones = datos.sesiones;
            if (datos.maxPacientesDia !== undefined) dataUpdate.maxPacientesDia = datos.maxPacientesDia;
            if (datos.modalidad !== undefined) dataUpdate.modalidad = datos.modalidad;
            if (datos.estado !== undefined) dataUpdate.estado = datos.estado;

            // Si se agregan ubicaciones propias, actualizar id_ubicacion con la primera
            if (datos.ubicacionIdsAgregar?.length) {
                dataUpdate.id_ubicacion = datos.ubicacionIdsAgregar[0];
            }

            await tx.servicio.update({ where: { id }, data: dataUpdate });

            // Desactivar centros de salud
            if (datos.centroSaludIdsEliminar?.length) {
                await tx.servicios_centros_salud.updateMany({
                    where: { id_servicio: id, id_centro_salud: { in: datos.centroSaludIdsEliminar } },
                    data: { estado: 'Inactivo' }
                });
            }

            // Desactivar horarios específicos
            if (datos.horariosEliminar?.length) {
                await tx.servicioHorario.updateMany({
                    where: { servicioId: id, horarioId: { in: datos.horariosEliminar } },
                    data: { estado: 'Inactivo' }
                });
                await tx.horario.updateMany({
                    where: { id: { in: datos.horariosEliminar } },
                    data: { estado: 'Inactivo' }
                });
            }

            // Agregar nuevos centros, ubicaciones y vincular horarios existentes
            if (datos.centroSaludIdsAgregar?.length) {
                await this._procesarCentros(tx, id, datos.centroSaludIdsAgregar);
            }
            if (datos.ubicacionIdsAgregar?.length) {
                await this._procesarUbicaciones(tx, id, datos.ubicacionIdsAgregar);
            }
            if (datos.ubicacionIdsEliminar?.length) {
                await tx.servicios_ubicaciones.updateMany({
                    where: { id_servicio: id, id_ubicacion: { in: datos.ubicacionIdsEliminar } },
                    data: { estado: 'Inactivo' }
                });
            }
            if (datos.horarioIdsAgregar?.length) {
                await this._vincularHorarios(tx, id, doctorId, datos.horarioIdsAgregar!);
            }
        });

        await this.redis.del(this.CACHE_KEY(doctorId));
        return (await this.buscarPorId(id))!;
    }

    // ─── Eliminar / Desactivar ───────────────────────────────────────────────
    async eliminar(id: number): Promise<Servicio> {
        const p = this.prisma as any;
        const ex = await p.servicio.findUnique({ where: { id } });
        if (!ex) throw new Error(`Servicio ${id} no existe`);
        const s = await p.servicio.update({ where: { id }, data: { estado: 'Eliminado', actualizadoEn: new Date() } });
        await this.redis.del(this.CACHE_KEY(ex.doctorId));
        return this.mapToDomain(s);
    }

    async desactivar(id: number): Promise<Servicio> {
        const p = this.prisma as any;
        const ex = await p.servicio.findUnique({ where: { id } });
        if (!ex) throw new Error(`Servicio ${id} no existe`);
        const s = await p.servicio.update({ where: { id }, data: { estado: 'Inactivo', actualizadoEn: new Date() } });
        await this.redis.del(this.CACHE_KEY(ex.doctorId));
        return this.mapToDomain(s);
    }

    // ─── Imágenes ────────────────────────────────────────────────────────────
    async agregarImagen(servicioId: number, url: string, orden: number): Promise<ServicioImagen> {
        const p = this.prisma as any;
        const img = await p.servicioImagen.create({ data: { servicioId, url, orden, estado: 'Activo' } });
        return this.mapImagenToDomain(img);
    }

    async eliminarImagen(imagenId: number): Promise<void> {
        const p = this.prisma as any;
        await p.servicioImagen.update({ where: { id: imagenId }, data: { estado: 'Eliminado' } });
    }

    async listarImagenes(servicioId: number): Promise<ServicioImagen[]> {
        const p = this.prisma as any;
        const imgs = await p.servicioImagen.findMany({ where: { servicioId, estado: 'Activo' }, orderBy: { orden: 'asc' } });
        return imgs.map((img: any) => this.mapImagenToDomain(img));
    }

    async contarImagenes(servicioId: number): Promise<number> {
        const p = this.prisma as any;
        return p.servicioImagen.count({ where: { servicioId, estado: 'Activo' } });
    }

    // ─── Helper: Registrar centros y ubicaciones ───────────────────────────────
    private async _procesarCentros(
        tx: any,
        servicioId: number,
        centroSaludIds: number[]
    ): Promise<void> {
        for (const centroId of centroSaludIds) {
            await tx.servicios_centros_salud.upsert({
                where: { id_servicio_id_centro_salud: { id_servicio: servicioId, id_centro_salud: centroId } },
                create: { id_servicio: servicioId, id_centro_salud: centroId, estado: 'Activo' },
                update: { estado: 'Activo' }
            });
        }
    }

    // ─── Helper: Registrar ubicaciones (M:N) ────────────────────────────────
    private async _procesarUbicaciones(
        tx: any,
        servicioId: number,
        ubicacionIds: number[]
    ): Promise<void> {
        for (const ubicId of ubicacionIds) {
            // Verificar que la ubicación existe
            const existe = await tx.ubicacion.findUnique({ where: { id: ubicId }, select: { id: true } });
            if (!existe) throw new Error(`Ubicación con ID ${ubicId} no existe en la base de datos`);

            await tx.servicios_ubicaciones.upsert({
                where: { id_servicio_id_ubicacion: { id_servicio: servicioId, id_ubicacion: ubicId } },
                create: { id_servicio: servicioId, id_ubicacion: ubicId, estado: 'Activo' },
                update: { estado: 'Activo' }
            });
        }
    }

    // ─── Helper: Vincular horarios existentes al servicio ───────────────────────
    private async _vincularHorarios(
        tx: any,
        servicioId: number,
        doctorId: number,
        horarioIds: number[]
    ): Promise<void> {
        for (const horarioId of horarioIds) {
            // Verificar que el horario existe y pertenece al doctor
            const horario = await tx.horario.findFirst({
                where: { id: horarioId, doctorId, estado: 'Activo' },
                select: { id: true }
            });
            if (!horario) {
                throw new Error(`Horario con ID ${horarioId} no encontrado o no pertenece al doctor`);
            }
            // Upsert para evitar duplicados
            await tx.servicioHorario.upsert({
                where: { servicioId_horarioId: { servicioId, horarioId } },
                create: { servicioId, horarioId, estado: 'Activo' },
                update: { estado: 'Activo' }
            });
        }
    }

    // ─── Helpers privados ─────────────────────────────────────────────────────
    private _buildWhere(base: any, filtros?: FiltrosServicio): any {
        const where: any = { ...base };
        if (filtros?.especialidadId) where.especialidadId = filtros.especialidadId;
        if (filtros?.tipoServicioId) where.tipoServicioId = filtros.tipoServicioId;
        if (filtros?.estado) where.estado = filtros.estado;
        else where.estado = { not: 'Eliminado' };
        if (filtros?.precioMin !== undefined || filtros?.precioMax !== undefined) {
            where.precio = {};
            if (filtros?.precioMin !== undefined) where.precio.gte = filtros.precioMin;
            if (filtros?.precioMax !== undefined) where.precio.lte = filtros.precioMax;
        }
        if (filtros?.diaSemana !== undefined) {
            where.horarios = {
                some: {
                    estado: 'Activo',
                    horario: {
                        estado: 'Activo',
                        horarios_dias: { some: { dia_semana: filtros.diaSemana } }
                    }
                }
            };
        }
        return where;
    }

    private _listInclude() {
        return {
            imagenes: { where: { estado: 'Activo' }, orderBy: { orden: 'asc' }, take: 1 },
            especialidad: { select: { id: true, nombre: true } },
            tipoServicio: { select: { id: true, nombre: true } },
            servicios_ubicaciones: UBICACIONES_INCLUDE,
            servicios_centros_salud: {
                where: { estado: 'Activo' },
                include: {
                    centros_salud: {
                        select: { usuarioId: true, nombreComercial: true, foto_perfil: true }
                    }
                }
            },
            horarios: HORARIOS_INCLUDE
        };
    }

    // ─── Mappers ──────────────────────────────────────────────────────────────
    private mapToDomain(s: any): Servicio {
        return new Servicio(
            s.id, s.doctorId, s.tipoServicioId, s.especialidadId,
            s.nombre, s.descripcion ?? null,
            Number(s.precio), s.duracionMinutos, s.maxPacientesDia ?? null,
            s.calificacionPromedio != null ? Number(s.calificacionPromedio) : null,
            s.modalidad ?? 'Presencial',
            s.estado, s.creadoEn, s.actualizadoEn ?? null
        );
    }

    private mapToDomainCompleto(s: any): Servicio {
        const imagenes = s.imagenes?.map((i: any) => this.mapImagenToDomain(i));
        // Las ubicaciones vienen de la tabla puente servicios_ubicaciones
        const ubicacionesArray = s.servicios_ubicaciones?.map((su: any) => su.ubicacion).filter(Boolean);
        return new Servicio(
            s.id, s.doctorId, s.tipoServicioId, s.especialidadId,
            s.nombre, s.descripcion ?? null,
            Number(s.precio), s.duracionMinutos, s.maxPacientesDia ?? null,
            s.calificacionPromedio != null ? Number(s.calificacionPromedio) : null,
            s.modalidad ?? 'Presencial',
            s.estado, s.creadoEn, s.actualizadoEn ?? null,
            imagenes,
            s.doctor,
            s.especialidad,
            s.tipoServicio,
            s.horarios,
            s.servicios_centros_salud,
            s.id_ubicacion ?? null,
            ubicacionesArray?.length ? ubicacionesArray : null
        );
    }

    private mapImagenToDomain(img: any): ServicioImagen {
        return new ServicioImagen(img.id, img.servicioId, img.url, img.orden, img.estado, img.creadoEn);
    }
}
