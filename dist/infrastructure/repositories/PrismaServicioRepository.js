"use strict";
/**
 * PrismaServicioRepository.ts
 *
 * Lógica completa de persistencia para Servicios.
 *
 * Diseño de sedes:
 *   centroSaludId → upsert en servicios_centros_salud + resuelve ubicacionId del centro
 *   ubicacionId   → establece servicios.id_ubicacion + usa directamente en el horario
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaServicioRepository = void 0;
const client_1 = require("@prisma/client");
const Servicio_1 = require("../../domain/entities/Servicio");
const ServicioImagen_1 = require("../../domain/entities/ServicioImagen");
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
};
const UBICACIONES_INCLUDE = {
    where: { estado: 'Activo' },
    include: {
        ubicacion: {
            select: {
                id: true,
                direccion: true,
                nombre: true,
                codigoPostal: true,
                barrio: {
                    select: {
                        id: true,
                        nombre: true,
                        seccion: {
                            select: {
                                id: true,
                                nombre: true,
                                id_municipio: true,
                                distritoMunicipal: {
                                    select: {
                                        id: true,
                                        nombre: true,
                                        municipio: {
                                            select: {
                                                id: true,
                                                nombre: true,
                                                provincia: {
                                                    select: {
                                                        id: true,
                                                        nombre: true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};
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
};
// ─── Helper: "HH:MM" → Date UTC (date parte neutra 1970-01-01) ───────────────
function horaADate(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date('1970-01-01T00:00:00Z');
    d.setUTCHours(h, m, 0, 0);
    return d;
}
// ─── Clase ───────────────────────────────────────────────────────────────────
class PrismaServicioRepository {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        this.CACHE_KEY = (doctorId) => `servicios:doctor:${doctorId}`;
        this.CACHE_TTL = 3600;
    }
    // ─── Crear ──────────────────────────────────────────────────────────────
    async crear(doctorId, especialidadId, nombre, descripcion, precio, duracionMinutos, sesiones, maxPacientesDia, modalidad, centroSaludIds, ubicacionIds, horarioIds) {
        const p = this.prisma;
        const creado = await p.$transaction(async (tx) => {
            const servicio = await tx.servicio.create({
                data: {
                    doctorId,
                    especialidadId,
                    nombre,
                    descripcion,
                    precio,
                    duracionMinutos,
                    sesiones,
                    maxPacientesDia,
                    modalidad,
                    estado: 'Activo',
                    // id_ubicacion se asigna con la primera ubicación si se proporciona
                    id_ubicacion: ubicacionIds?.length ? ubicacionIds[0] : null
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
    async buscarPorId(id) {
        const p = this.prisma;
        const s = await p.servicio.findUnique({
            where: { id },
            include: {
                imagenes: { where: { estado: 'Activo' }, orderBy: { orden: 'asc' } },
                doctor: {
                    include: {
                        usuario: { select: { id: true, email: true, fotoPerfil: true } },
                        idiomas: {
                            where: { estado: 'Activo' },
                            select: { id: true, nombre: true, nivel: true }
                        }
                    }
                },
                especialidad: true,
                servicios_ubicaciones: UBICACIONES_INCLUDE,
                servicios_centros_salud: CENTROS_INCLUDE,
                horarios: HORARIOS_INCLUDE,
                resenas: {
                    where: { estado: 'Publicada' },
                    orderBy: { creadoEn: 'desc' },
                    take: 5,
                    select: {
                        id: true,
                        calificacion: true,
                        comentario: true,
                        creadoEn: true,
                        paciente: {
                            select: {
                                nombre: true,
                                apellido: true,
                                usuario: { select: { fotoPerfil: true } }
                            }
                        }
                    }
                }
            }
        });
        if (!s)
            return null;
        await this._enrichUbicacionesConCoordenadas([s]);
        await this._enrichSeccionesConMunicipio([s]);
        return this.mapToDomainCompleto(s);
    }
    // ─── Listar por doctor ──────────────────────────────────────────────────
    async listarPorDoctor(doctorId, filtros) {
        const p = this.prisma;
        const hayFiltros = filtros && Object.keys(filtros).length > 0;
        if (!hayFiltros) {
            const cached = await this.redis.get(this.CACHE_KEY(doctorId));
            if (cached) {
                try {
                    return JSON.parse(cached).map(s => this.mapToDomainCompleto(s));
                }
                catch { /* cache corrupto */ }
            }
        }
        const where = this._buildWhere({ doctorId }, filtros);
        const servicios = await p.servicio.findMany({
            where,
            include: this._listInclude(),
            orderBy: { creadoEn: 'desc' }
        });
        const resultado = servicios.map((s) => this.mapToDomainCompleto(s));
        if (!hayFiltros) {
            await this._enrichUbicacionesConCoordenadas(servicios);
            await this._enrichSeccionesConMunicipio(servicios);
            await this.redis.set(this.CACHE_KEY(doctorId), JSON.stringify(servicios), this.CACHE_TTL);
        }
        else {
            await this._enrichUbicacionesConCoordenadas(servicios);
            await this._enrichSeccionesConMunicipio(servicios);
        }
        return servicios.map((s) => this.mapToDomainCompleto(s));
    }
    // ─── Listar por centro ──────────────────────────────────────────────────
    async listarPorCentro(centroId, filtros) {
        const p = this.prisma;
        const whereBase = {
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
        await this._enrichUbicacionesConCoordenadas(servicios);
        await this._enrichSeccionesConMunicipio(servicios);
        return servicios.map((s) => this.mapToDomainCompleto(s));
    }
    // ─── Actualizar ─────────────────────────────────────────────────────────
    async actualizar(id, datos) {
        const p = this.prisma;
        const existente = await p.servicio.findUnique({ where: { id } });
        if (!existente)
            throw new Error(`Servicio con ID ${id} no existe`);
        const doctorId = existente.doctorId;
        await p.$transaction(async (tx) => {
            const dataUpdate = { actualizadoEn: new Date() };
            if (datos.especialidadId !== undefined)
                dataUpdate.especialidadId = datos.especialidadId;
            if (datos.nombre !== undefined)
                dataUpdate.nombre = datos.nombre;
            if (datos.descripcion !== undefined)
                dataUpdate.descripcion = datos.descripcion;
            if (datos.precio !== undefined)
                dataUpdate.precio = datos.precio;
            if (datos.duracionMinutos !== undefined)
                dataUpdate.duracionMinutos = datos.duracionMinutos;
            if (datos.sesiones !== undefined)
                dataUpdate.sesiones = datos.sesiones;
            if (datos.maxPacientesDia !== undefined)
                dataUpdate.maxPacientesDia = datos.maxPacientesDia;
            if (datos.modalidad !== undefined)
                dataUpdate.modalidad = datos.modalidad;
            if (datos.estado !== undefined)
                dataUpdate.estado = datos.estado;
            // Actualizar id_ubicacion con el primer ID de la nueva lista (si se proporciona)
            if (datos.ubicacionIds?.length) {
                dataUpdate.id_ubicacion = datos.ubicacionIds[0];
            }
            else if (datos.ubicacionIds !== undefined) {
                // Array vacío explícito → limpiar la ubicación principal
                dataUpdate.id_ubicacion = null;
            }
            await tx.servicio.update({ where: { id }, data: dataUpdate });
            // ── Centros de salud: set completo ──────────────────────────────
            if (datos.centroSaludIds !== undefined) {
                const nuevosIds = datos.centroSaludIds ?? [];
                // Desactivar los que ya no están en la nueva lista
                await tx.servicios_centros_salud.updateMany({
                    where: {
                        id_servicio: id,
                        estado: 'Activo',
                        ...(nuevosIds.length
                            ? { id_centro_salud: { notIn: nuevosIds } }
                            : {})
                    },
                    data: { estado: 'Inactivo' }
                });
                // Activar / crear los nuevos
                if (nuevosIds.length) {
                    await this._procesarCentros(tx, id, nuevosIds);
                }
            }
            // ── Ubicaciones: set completo ────────────────────────────────────
            if (datos.ubicacionIds !== undefined) {
                const nuevosIds = datos.ubicacionIds ?? [];
                // Desactivar las que ya no están en la nueva lista
                await tx.servicios_ubicaciones.updateMany({
                    where: {
                        id_servicio: id,
                        estado: 'Activo',
                        ...(nuevosIds.length
                            ? { id_ubicacion: { notIn: nuevosIds } }
                            : {})
                    },
                    data: { estado: 'Inactivo' }
                });
                // Activar / crear las nuevas
                if (nuevosIds.length) {
                    await this._procesarUbicaciones(tx, id, nuevosIds);
                }
            }
            // ── Horarios: set completo ───────────────────────────────────────
            if (datos.horarioIds !== undefined) {
                const nuevosIds = datos.horarioIds ?? [];
                // Desactivar los vínculos que ya no están en la nueva lista
                await tx.servicioHorario.updateMany({
                    where: {
                        servicioId: id,
                        estado: 'Activo',
                        ...(nuevosIds.length
                            ? { horarioId: { notIn: nuevosIds } }
                            : {})
                    },
                    data: { estado: 'Inactivo' }
                });
                // Vincular / activar los nuevos
                if (nuevosIds.length) {
                    await this._vincularHorarios(tx, id, doctorId, nuevosIds);
                }
            }
        });
        await this.redis.del(this.CACHE_KEY(doctorId));
        return (await this.buscarPorId(id));
    }
    // ─── Eliminar / Desactivar ───────────────────────────────────────────────
    async eliminar(id) {
        const p = this.prisma;
        const ex = await p.servicio.findUnique({ where: { id } });
        if (!ex)
            throw new Error(`Servicio ${id} no existe`);
        const s = await p.servicio.update({ where: { id }, data: { estado: 'Eliminado', actualizadoEn: new Date() } });
        await this.redis.del(this.CACHE_KEY(ex.doctorId));
        return this.mapToDomain(s);
    }
    async desactivar(id) {
        const p = this.prisma;
        const ex = await p.servicio.findUnique({ where: { id } });
        if (!ex)
            throw new Error(`Servicio ${id} no existe`);
        const s = await p.servicio.update({ where: { id }, data: { estado: 'Inactivo', actualizadoEn: new Date() } });
        await this.redis.del(this.CACHE_KEY(ex.doctorId));
        return this.mapToDomain(s);
    }
    // ─── Imágenes ────────────────────────────────────────────────────────────
    async agregarImagen(servicioId, url, orden) {
        const p = this.prisma;
        const img = await p.servicioImagen.create({ data: { servicioId, url, orden, estado: 'Activo' } });
        return this.mapImagenToDomain(img);
    }
    async eliminarImagen(imagenId) {
        const p = this.prisma;
        await p.servicioImagen.update({ where: { id: imagenId }, data: { estado: 'Eliminado' } });
    }
    async listarImagenes(servicioId) {
        const p = this.prisma;
        const imgs = await p.servicioImagen.findMany({ where: { servicioId, estado: 'Activo' }, orderBy: { orden: 'asc' } });
        return imgs.map((img) => this.mapImagenToDomain(img));
    }
    async contarImagenes(servicioId) {
        const p = this.prisma;
        return p.servicioImagen.count({ where: { servicioId, estado: 'Activo' } });
    }
    // ─── Helper: Registrar centros y ubicaciones ───────────────────────────────
    async _procesarCentros(tx, servicioId, centroSaludIds) {
        for (const centroId of centroSaludIds) {
            await tx.servicios_centros_salud.upsert({
                where: { id_servicio_id_centro_salud: { id_servicio: servicioId, id_centro_salud: centroId } },
                create: { id_servicio: servicioId, id_centro_salud: centroId, estado: 'Activo' },
                update: { estado: 'Activo' }
            });
        }
    }
    // ─── Helper: Registrar ubicaciones (M:N) ────────────────────────────────
    async _procesarUbicaciones(tx, servicioId, ubicacionIds) {
        for (const ubicId of ubicacionIds) {
            // Verificar que la ubicación existe
            const existe = await tx.ubicacion.findUnique({ where: { id: ubicId }, select: { id: true } });
            if (!existe)
                throw new Error(`Ubicación con ID ${ubicId} no existe en la base de datos`);
            await tx.servicios_ubicaciones.upsert({
                where: { id_servicio_id_ubicacion: { id_servicio: servicioId, id_ubicacion: ubicId } },
                create: { id_servicio: servicioId, id_ubicacion: ubicId, estado: 'Activo' },
                update: { estado: 'Activo' }
            });
        }
    }
    // ─── Helper: Vincular horarios existentes al servicio ───────────────────────
    async _vincularHorarios(tx, servicioId, doctorId, horarioIds) {
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
    _buildWhere(base, filtros) {
        const where = { ...base };
        if (filtros?.especialidadId)
            where.especialidadId = filtros.especialidadId;
        if (filtros?.estado)
            where.estado = filtros.estado;
        else
            where.estado = { not: 'Eliminado' };
        if (filtros?.precioMin !== undefined || filtros?.precioMax !== undefined) {
            where.precio = {};
            if (filtros?.precioMin !== undefined)
                where.precio.gte = filtros.precioMin;
            if (filtros?.precioMax !== undefined)
                where.precio.lte = filtros.precioMax;
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
    _listInclude() {
        return {
            imagenes: { where: { estado: 'Activo' }, orderBy: { orden: 'asc' }, take: 1 },
            doctor: {
                include: {
                    usuario: { select: { id: true, email: true, fotoPerfil: true } },
                    idiomas: {
                        where: { estado: 'Activo' },
                        select: { id: true, nombre: true, nivel: true }
                    }
                }
            },
            especialidad: { select: { id: true, nombre: true } },
            servicios_ubicaciones: UBICACIONES_INCLUDE,
            servicios_centros_salud: {
                where: { estado: 'Activo' },
                include: {
                    centros_salud: {
                        select: { usuarioId: true, nombreComercial: true, foto_perfil: true }
                    }
                }
            },
            horarios: HORARIOS_INCLUDE,
            resenas: {
                where: { estado: 'Publicada' },
                orderBy: { creadoEn: 'desc' },
                take: 3,
                select: {
                    id: true,
                    calificacion: true,
                    comentario: true,
                    creadoEn: true,
                    paciente: {
                        select: {
                            nombre: true,
                            apellido: true,
                            usuario: { select: { fotoPerfil: true } }
                        }
                    }
                }
            }
        };
    }
    // ─── Mappers ──────────────────────────────────────────────────────────────
    mapToDomain(s) {
        return new Servicio_1.Servicio(s.id, s.doctorId, s.especialidadId, s.nombre, s.descripcion ?? null, Number(s.precio), s.duracionMinutos, s.maxPacientesDia ?? null, s.calificacionPromedio != null ? Number(s.calificacionPromedio) : null, s.modalidad ?? 'Presencial', s.estado, s.creadoEn, s.actualizadoEn ?? null);
    }
    mapToDomainCompleto(s) {
        const imagenes = s.imagenes?.map((i) => this.mapImagenToDomain(i));
        // Las ubicaciones vienen de la tabla puente servicios_ubicaciones
        const ubicacionesArray = s.servicios_ubicaciones?.map((su) => su.ubicacion).filter(Boolean);
        // Formatear horaInicio/horaFin de cada horario a HH:mm
        const horarios = s.horarios?.map((sh) => ({
            ...sh,
            horario: sh.horario ? {
                ...sh.horario,
                horaInicio: this.dateAHHMM(sh.horario.horaInicio),
                horaFin: this.dateAHHMM(sh.horario.horaFin)
            } : sh.horario
        }));
        // Normalizar calificacionPromedio del doctor de Prisma.Decimal → number
        const doctor = s.doctor
            ? {
                ...s.doctor,
                calificacionPromedio: s.doctor.calificacionPromedio != null
                    ? Number(s.doctor.calificacionPromedio)
                    : null,
            }
            : s.doctor;
        return new Servicio_1.Servicio(s.id, s.doctorId, s.especialidadId, s.nombre, s.descripcion ?? null, Number(s.precio), s.duracionMinutos, s.maxPacientesDia ?? null, s.calificacionPromedio != null ? Number(s.calificacionPromedio) : null, s.modalidad ?? 'Presencial', s.estado, s.creadoEn, s.actualizadoEn ?? null, imagenes, doctor, s.especialidad, horarios, s.servicios_centros_salud, s.id_ubicacion ?? null, ubicacionesArray?.length ? ubicacionesArray : null, s.resenas ?? undefined);
    }
    mapImagenToDomain(img) {
        return new ServicioImagen_1.ServicioImagen(img.id, img.servicioId, img.url, img.orden, img.estado, img.creadoEn);
    }
    /** Convierte un Date (o string ISO) al formato "HH:mm" */
    dateAHHMM(value) {
        if (!value)
            return null;
        const d = value instanceof Date ? value : new Date(value);
        const hh = String(d.getUTCHours()).padStart(2, '0');
        const mm = String(d.getUTCMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
    }
    /**
     * Enriquece los servicios con las coordenadas (latitud/longitud) de sus ubicaciones
     * usando una query raw de PostGIS (ST_Y = latitud, ST_X = longitud).
     */
    async _enrichUbicacionesConCoordenadas(servicios) {
        // Recolectar todos los IDs de ubicaciones de los servicios
        const ubicacionIds = [];
        for (const s of servicios) {
            for (const su of s.servicios_ubicaciones ?? []) {
                if (su.ubicacion?.id)
                    ubicacionIds.push(su.ubicacion.id);
            }
        }
        if (ubicacionIds.length === 0)
            return;
        // Query raw: obtener lat/lng de cada ubicación
        const rows = await this.prisma.$queryRaw `
            SELECT
                id_ubicacion           AS id,
                ST_Y(punto_geografico) AS latitud,
                ST_X(punto_geografico) AS longitud
            FROM ubicaciones
            WHERE id_ubicacion IN (${client_1.Prisma.join(ubicacionIds)})
              AND punto_geografico IS NOT NULL
        `;
        // Crear mapa id → coordenadas
        const coordsMap = new Map();
        for (const row of rows) {
            coordsMap.set(Number(row.id), {
                latitud: Number(row.latitud),
                longitud: Number(row.longitud)
            });
        }
        // Mergear coordenadas en los objetos ubicacion
        for (const s of servicios) {
            for (const su of s.servicios_ubicaciones ?? []) {
                if (su.ubicacion?.id) {
                    const coords = coordsMap.get(su.ubicacion.id);
                    if (coords) {
                        su.ubicacion.latitud = coords.latitud;
                        su.ubicacion.longitud = coords.longitud;
                    }
                }
            }
        }
    }
    /**
     * Enriquece secciones que NO tienen distritoMunicipal pero sí id_municipio.
     * Adjunta municipio (con provincia) directamente en la sección para que
     * la jerarquía geográfica esté completa aunque no exista distrito.
     */
    async _enrichSeccionesConMunicipio(servicios) {
        // Recolectar id_municipio de secciones sin distritoMunicipal
        const municipioIds = new Set();
        for (const s of servicios) {
            for (const su of s.servicios_ubicaciones ?? []) {
                const seccion = su.ubicacion?.barrio?.seccion;
                if (seccion && !seccion.distritoMunicipal && seccion.id_municipio) {
                    municipioIds.add(Number(seccion.id_municipio));
                }
            }
        }
        if (municipioIds.size === 0)
            return;
        const municipios = await this.prisma.municipio.findMany({
            where: { id: { in: Array.from(municipioIds) } },
            select: {
                id: true,
                nombre: true,
                provincia: { select: { id: true, nombre: true } }
            }
        });
        const municipioMap = new Map();
        for (const m of municipios)
            municipioMap.set(m.id, m);
        // Adjuntar municipio a las secciones sin distrito
        for (const s of servicios) {
            for (const su of s.servicios_ubicaciones ?? []) {
                const seccion = su.ubicacion?.barrio?.seccion;
                if (seccion && !seccion.distritoMunicipal && seccion.id_municipio) {
                    seccion.municipio = municipioMap.get(Number(seccion.id_municipio)) ?? null;
                }
            }
        }
    }
    // ─── Buscar servicios por cercanía geográfica ──────────────────────────────
    async buscarCercanos(lat, lng, radioKm, filtros, pacienteId) {
        const radioMetros = radioKm * 1000;
        // Construir cláusulas de filtros opcionales en SQL
        const condiciones = [];
        if (filtros?.especialidadId) {
            condiciones.push(client_1.Prisma.sql `s.id_especialidad = ${filtros.especialidadId}`);
        }
        if (filtros?.modalidad) {
            condiciones.push(client_1.Prisma.sql `s.modalidad = ${filtros.modalidad}`);
        }
        if (filtros?.precioMin !== undefined) {
            condiciones.push(client_1.Prisma.sql `s.precio >= ${filtros.precioMin}`);
        }
        if (filtros?.precioMax !== undefined) {
            condiciones.push(client_1.Prisma.sql `s.precio <= ${filtros.precioMax}`);
        }
        const extraWhere = condiciones.length > 0
            ? client_1.Prisma.sql `AND ${client_1.Prisma.join(condiciones, ' AND ')}`
            : client_1.Prisma.sql ``;
        // Query raw: obtener IDs únicos de servicios dentro del radio, con distancia
        const rows = await this.prisma.$queryRaw `
            SELECT DISTINCT ON (s.id_servicio)
                s.id_servicio                                          AS id,
                ST_Distance(
                    u.punto_geografico::geography,
                    ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
                )                                                      AS distancia_metros
            FROM servicios s
            JOIN servicios_ubicaciones su
                ON su.id_servicio  = s.id_servicio
               AND su.estado       = 'Activo'
            JOIN ubicaciones u
                ON u.id_ubicacion  = su.id_ubicacion
               AND u.punto_geografico IS NOT NULL
            WHERE s.estado = 'Activo'
              AND ST_DWithin(
                    u.punto_geografico::geography,
                    ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
                    ${radioMetros}
                  )
            ${extraWhere}
            ORDER BY s.id_servicio, distancia_metros ASC
        `;
        if (rows.length === 0)
            return [];
        // Mapa id → distancia
        const distanciaMap = new Map();
        for (const r of rows) {
            distanciaMap.set(Number(r.id), Number(r.distancia_metros));
        }
        // Ordenar IDs por distancia
        const idOrdenados = [...distanciaMap.entries()]
            .sort((a, b) => a[1] - b[1])
            .map(([id]) => id);
        // Cargar servicios completos en lote (usando p.servicio.findMany)
        const p = this.prisma;
        const serviciosRaw = await p.servicio.findMany({
            where: { id: { in: idOrdenados } },
            include: this._listInclude()
        });
        await this._enrichUbicacionesConCoordenadas(serviciosRaw);
        await this._enrichSeccionesConMunicipio(serviciosRaw);
        // Obtener IDs de doctores favoritos del paciente (si aplica)
        let favoritosSet = new Set();
        if (pacienteId) {
            const favRows = await p.doctorFavorito.findMany({
                where: { pacienteId, estado: 'Activo' },
                select: { doctorId: true }
            });
            favoritosSet = new Set(favRows.map((f) => f.doctorId));
        }
        // Mapear, preservar orden y adjuntar distanciaMetros + doctorEsFavorito
        const serviciosMap = new Map();
        for (const s of serviciosRaw)
            serviciosMap.set(s.id, s);
        return idOrdenados
            .map(id => {
            const raw = serviciosMap.get(id);
            if (!raw)
                return null;
            const servicio = this.mapToDomainCompleto(raw);
            servicio.distanciaMetros = Math.round(distanciaMap.get(id));
            servicio.doctorEsFavorito = favoritosSet.has(raw.doctorId);
            return servicio;
        })
            .filter((s) => s !== null);
    }
}
exports.PrismaServicioRepository = PrismaServicioRepository;
