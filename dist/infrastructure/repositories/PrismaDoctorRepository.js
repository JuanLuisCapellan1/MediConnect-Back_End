"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaDoctorRepository = void 0;
const client_1 = require("@prisma/client");
const Doctor_1 = require("../../domain/entities/Doctor");
const SupabaseStorageService_1 = require("../external-services/SupabaseStorageService");
class PrismaDoctorRepository {
    constructor(prisma) {
        this.prisma = prisma;
        this.storage = new SupabaseStorageService_1.SupabaseStorageService();
    }
    mapearEntidad(data) {
        const doc = new Doctor_1.Doctor(data.usuarioId, data.usuarioId, data.nombre, data.apellido, data.tipoDocIdentificacion, data.numeroDocumentoIdentificacion, data.fechaNacimiento, data.genero, data.nacionalidad, data.exequatur, data.biografia, data.anosExperiencia, data.estadoVerificacion, data.calificacionPromedio ? parseFloat(data.calificacionPromedio.toString()) : null, data.estado, data.creadoEn, data.actualizadoEn, data.duracionCitaPromedio, data.tarifas ? parseFloat(data.tarifas.toString()) : null);
        // Si vienen las especialidades incluidas desde Prisma, mapear objeto estructurado
        if (data.especialidades && Array.isArray(data.especialidades)) {
            doc.especialidades = data.especialidades.map((e) => ({
                id_especialidad: e.especialidadId,
                nombre: e.especialidades?.nombre || null,
                es_principal: e.es_principal
            }));
        }
        return doc;
    }
    async obtenerPorId(id) {
        const doctor = await this.prisma.doctor.findUnique({
            where: { usuarioId: id },
            include: {
                usuario: {
                    select: {
                        email: true,
                        telefono: true,
                        fotoPerfil: true,
                    },
                },
                especialidades: {
                    include: {
                        especialidades: true,
                    },
                },
            },
        });
        return doctor ? this.mapearEntidad(doctor) : null;
    }
    async obtenerPorUsuarioId(usuarioId) {
        const doctor = await this.prisma.doctor.findUnique({
            where: { usuarioId },
            include: {
                usuario: {
                    select: {
                        email: true,
                        telefono: true,
                        fotoPerfil: true,
                    },
                },
                especialidades: {
                    include: {
                        especialidades: true,
                    },
                },
                documentos: {
                    where: {
                        estado: 'Activo',
                    },
                    select: {
                        id: true,
                        tipoDocumento: true,
                        urlArchivo: true,
                        estadoRevision: true,
                        descripcion: true,
                        creadoEn: true,
                    },
                    orderBy: {
                        creadoEn: 'desc',
                    },
                },
            },
        });
        if (!doctor)
            return null;
        // Regenerar URLs firmadas frescas para cada documento
        if (doctor.documentos && Array.isArray(doctor.documentos)) {
            doctor.documentos = await Promise.all(doctor.documentos.map(async (doc) => ({
                ...doc,
                urlArchivo: doc.urlArchivo
                    ? await this.storage.refreshOrGetSignedUrl(doc.urlArchivo).catch(() => doc.urlArchivo)
                    : null,
            })));
        }
        return this.mapearEntidad(doctor);
    }
    /**
     * Obtiene el perfil completo del doctor con todas sus relaciones
     * Retorna los datos sin mapear a la entidad para incluir toda la información
     */
    async obtenerPerfilCompleto(usuarioId) {
        const doctor = await this.prisma.doctor.findUnique({
            where: { usuarioId },
            include: {
                usuario: {
                    select: {
                        email: true,
                        telefono: true,
                        fotoPerfil: true,
                        banner: true,
                        emailVerificado: true,
                    },
                },
                ubicaciones: true,
                especialidades: {
                    include: {
                        especialidades: true,
                    },
                },
                documentos: {
                    where: {
                        estado: 'Activo',
                    },
                    include: {
                        acciones: {
                            orderBy: {
                                fechaEmision: 'desc'
                            },
                            take: 3,
                            select: {
                                id: true,
                                comentarioAdmin: true,
                                estado: true,
                                fechaResolucion: true,
                                fechaEmision: true,
                            }
                        }
                    },
                    orderBy: {
                        creadoEn: 'desc',
                    },
                },
                experiencias: {
                    where: {
                        estado: 'Activo',
                    },
                    orderBy: {
                        creadoEn: 'desc',
                    },
                },
                formaciones: {
                    where: {
                        estado: 'Activo',
                    },
                    orderBy: {
                        creadoEn: 'desc',
                    },
                },
                horarios: {
                    where: {
                        estado: 'Activo',
                    },
                    include: {
                        horarios_dias: { select: { dia_semana: true } },
                    },
                    orderBy: {
                        creadoEn: 'asc',
                    },
                },
                servicios: {
                    where: {
                        estado: 'Activo',
                    },
                },
                segurosAceptados: {
                    include: {
                        seguro: true,
                    },
                },
                resenas: {
                    where: { estado: 'Publicada' },
                    orderBy: { creadoEn: 'desc' },
                    take: 5,
                    select: {
                        id: true,
                        calificacion: true,
                        comentario: true,
                        creadoEn: true,
                        servicioId: true,
                        servicio: { select: { id: true, nombre: true } },
                        paciente: {
                            select: {
                                nombre: true,
                                apellido: true,
                                usuario: { select: { fotoPerfil: true } }
                            }
                        }
                    }
                },
            },
        });
        // If doctor exists, fetch general verification comment and process documents
        if (doctor) {
            const accionVerificacion = await this.prisma.accion.findFirst({
                where: {
                    emisorId: usuarioId,
                    documentoId: null,
                },
                orderBy: {
                    fechaEmision: 'desc'
                },
                select: {
                    id: true,
                    comentarioAdmin: true,
                    estado: true,
                    fechaResolucion: true
                }
            });
            // Always add verification comment fields (null if not found)
            doctor.idAccionRegistro = accionVerificacion?.id || null;
            doctor.comentarioVerificacion = accionVerificacion?.comentarioAdmin || null;
            doctor.estadoAccionVerificacion = accionVerificacion?.estado || null;
            doctor.fechaResolucionVerificacion = accionVerificacion?.fechaResolucion || null;
            // Process documents: aplanar comentarioAdmin y regenerar URL firmada fresca
            if (doctor.documentos && Array.isArray(doctor.documentos)) {
                doctor.documentos = await Promise.all(doctor.documentos.map(async (doc) => {
                    const accionPendiente = doc.acciones?.find((a) => a.estado === 'Pendiente') || null;
                    const accionResuelta = doc.acciones?.find((a) => a.comentarioAdmin) || null;
                    // idAccion → la acción Pendiente (la que el admin puede aprobar/rechazar ahora)
                    const idAccion = accionPendiente?.id || null;
                    // comentario del admin → el del rechazo previo, para que el doctor vea el motivo
                    const comentarioAdmin = accionResuelta?.comentarioAdmin || null;
                    const estadoAccion = accionPendiente?.estado || accionResuelta?.estado || null;
                    const fechaResolucion = accionResuelta?.fechaResolucion || null;
                    const { acciones, ...docSinAcciones } = doc;
                    // Regenerar URL firmada fresca (1 hora de validez)
                    const urlArchivo = docSinAcciones.urlArchivo
                        ? await this.storage.refreshOrGetSignedUrl(docSinAcciones.urlArchivo).catch(() => docSinAcciones.urlArchivo)
                        : null;
                    return {
                        ...docSinAcciones,
                        urlArchivo,
                        idAccion,
                        comentarioAdmin,
                        estadoAccion,
                        fechaResolucionAccion: fechaResolucion
                    };
                }));
            }
        }
        // Convertir campos Decimal de Prisma a number plano para evitar serialización interna ({s,e,d})
        if (doctor) {
            if (doctor.calificacionPromedio != null)
                doctor.calificacionPromedio = parseFloat(doctor.calificacionPromedio.toString());
            if (doctor.tarifas != null)
                doctor.tarifas = parseFloat(doctor.tarifas.toString());
            // Convertir precio de cada servicio asociado
            if (Array.isArray(doctor.servicios)) {
                doctor.servicios = doctor.servicios.map((s) => ({
                    ...s,
                    precio: s.precio != null ? parseFloat(s.precio.toString()) : null,
                }));
            }
        }
        // Enriquecer ubicaciones con coords PostGIS (latitud, longitud y dirección completa)
        if (doctor && Array.isArray(doctor.ubicaciones) && doctor.ubicaciones.length > 0) {
            const ubicIds = doctor.ubicaciones
                .map((u) => u.id)
                .filter(Boolean);
            if (ubicIds.length > 0) {
                const geoRows = await this.prisma.$queryRaw `
                    SELECT
                        u.id_ubicacion                        AS id,
                        ST_Y(u.punto_geografico::geometry)    AS latitud,
                        ST_X(u.punto_geografico::geometry)    AS longitud,
                        b.nombre                              AS barrio_nombre,
                        m.nombre                              AS municipio_nombre,
                        p.nombre                              AS provincia_nombre
                    FROM ubicaciones u
                    LEFT JOIN barrios              b  ON b.id_barrio             = u.id_barrio
                    LEFT JOIN secciones            s  ON s.id_seccion             = b.id_seccion
                    LEFT JOIN distritos_municipales dm ON dm.id_distrito_municipal = s.id_distrito_municipal
                    LEFT JOIN municipios           m  ON m.id_municipio           = COALESCE(dm.id_municipio, s.id_municipio)
                    LEFT JOIN provincias           p  ON p.id_provincia           = m.id_provincia
                    WHERE u.id_ubicacion IN (${client_1.Prisma.join(ubicIds)})
                `;
                const geoMap = new Map();
                for (const row of geoRows)
                    geoMap.set(Number(row.id), row);
                doctor.ubicaciones = doctor.ubicaciones.map((u) => {
                    const geo = geoMap.get(u.id);
                    if (!geo)
                        return u;
                    const partes = [];
                    if (u.direccion)
                        partes.push(u.direccion.trim());
                    if (geo.barrio_nombre)
                        partes.push(geo.barrio_nombre.trim());
                    if (geo.municipio_nombre)
                        partes.push(geo.municipio_nombre.trim());
                    if (geo.provincia_nombre)
                        partes.push(geo.provincia_nombre.trim());
                    return {
                        ...u,
                        latitud: geo.latitud != null ? Number(geo.latitud) : null,
                        longitud: geo.longitud != null ? Number(geo.longitud) : null,
                        barrioNombre: geo.barrio_nombre,
                        municipioNombre: geo.municipio_nombre,
                        provinciaNombre: geo.provincia_nombre,
                        direccionCompleta: partes.join(', '),
                    };
                });
            }
        }
        return doctor;
    }
    /**
     * Compara hasta 4 doctores por sus IDs,
     * devolviendo el perfil público completo de cada uno.
     */
    async compararDoctores(ids) {
        const doctores = await this.prisma.doctor.findMany({
            where: {
                usuarioId: { in: ids },
                estado: 'Activo',
                estadoVerificacion: 'Aprobado',
            },
            include: {
                usuario: {
                    select: {
                        email: true,
                        telefono: true,
                        fotoPerfil: true,
                    },
                },
                ubicaciones: true,
                especialidades: {
                    include: { especialidades: true },
                },
                experiencias: {
                    where: { estado: 'Activo' },
                    orderBy: { creadoEn: 'desc' },
                },
                formaciones: {
                    where: { estado: 'Activo' },
                    orderBy: { creadoEn: 'desc' },
                },
                horarios: {
                    where: { estado: 'Activo' },
                    include: {
                        horarios_dias: { select: { dia_semana: true } },
                    },
                    orderBy: { creadoEn: 'asc' },
                },
                servicios: {
                    where: { estado: 'Activo' },
                },
                segurosAceptados: {
                    include: { seguro: true, tipoSeguro: true },
                },
                idiomas: {
                    where: { estado: 'Activo' },
                },
                resenas: {
                    where: { estado: 'Publicada' },
                    orderBy: { creadoEn: 'desc' },
                    take: 5,
                    select: {
                        id: true,
                        calificacion: true,
                        comentario: true,
                        creadoEn: true,
                        servicioId: true,
                        servicio: { select: { id: true, nombre: true } },
                        paciente: {
                            select: {
                                nombre: true,
                                apellido: true,
                                usuario: { select: { fotoPerfil: true } }
                            }
                        }
                    }
                },
            },
        });
        return doctores;
    }
    async obtenerTodos(filtros) {
        const pagina = filtros.pagina || 1;
        const limite = filtros.limite || 10;
        const skip = (pagina - 1) * limite;
        const where = {};
        if (filtros.nombre) {
            where.nombre = { contains: filtros.nombre, mode: 'insensitive' };
        }
        if (filtros.apellido) {
            where.apellido = { contains: filtros.apellido, mode: 'insensitive' };
        }
        if (filtros.genero) {
            where.genero = filtros.genero;
        }
        if (filtros.nacionalidad) {
            where.nacionalidad = filtros.nacionalidad;
        }
        if (filtros.estadoVerificacion) {
            where.estadoVerificacion = filtros.estadoVerificacion;
        }
        if (filtros.estado) {
            where.estado = filtros.estado;
        }
        else {
            where.estado = { not: 'Eliminado' };
        }
        // Filtrar por especialidad si se proporciona
        if (filtros.especialidadId) {
            where.especialidades = {
                some: {
                    especialidadId: filtros.especialidadId,
                },
            };
        }
        const [datos, total] = await Promise.all([
            this.prisma.doctor.findMany({
                where,
                skip,
                take: limite,
                orderBy: { creadoEn: 'desc' },
                include: {
                    usuario: {
                        select: {
                            email: true,
                            telefono: true,
                            fotoPerfil: true,
                        },
                    },
                    especialidades: {
                        include: {
                            especialidades: true,
                        },
                    },
                },
            }),
            this.prisma.doctor.count({ where }),
        ]);
        return {
            datos: datos.map((d) => this.mapearEntidad(d)),
            total,
        };
    }
    async actualizar(usuarioId, datos) {
        const dataToUpdate = {};
        if (datos.nombre !== undefined)
            dataToUpdate.nombre = datos.nombre;
        if (datos.apellido !== undefined)
            dataToUpdate.apellido = datos.apellido;
        if (datos.biografia !== undefined)
            dataToUpdate.biografia = datos.biografia;
        if (datos.anosExperiencia !== undefined)
            dataToUpdate.anosExperiencia = datos.anosExperiencia;
        if (datos.tarifas !== undefined)
            dataToUpdate.tarifas = datos.tarifas;
        if (datos.duracionCitaPromedio !== undefined)
            dataToUpdate.duracionCitaPromedio = datos.duracionCitaPromedio;
        if (datos.nacionalidad !== undefined)
            dataToUpdate.nacionalidad = datos.nacionalidad;
        if (datos.estado !== undefined)
            dataToUpdate.estado = datos.estado;
        if (datos.fechaNacimiento !== undefined)
            dataToUpdate.fechaNacimiento = datos.fechaNacimiento;
        dataToUpdate.actualizadoEn = new Date();
        // Actualizar también el teléfono en la tabla Usuario si se proporciona
        if (datos.telefono !== undefined) {
            await this.prisma.usuario.update({
                where: { id: usuarioId },
                data: { telefono: datos.telefono },
            });
        }
        const doctorActualizado = await this.prisma.doctor.update({
            where: { usuarioId },
            data: dataToUpdate,
            include: {
                usuario: {
                    select: {
                        email: true,
                        telefono: true,
                        fotoPerfil: true,
                    },
                },
                especialidades: {
                    include: {
                        especialidades: true,
                    },
                },
            },
        });
        return this.mapearEntidad(doctorActualizado);
    }
    async eliminar(usuarioId) {
        // Eliminación lógica: actualizar estado en doctor y usuario
        await this.prisma.$transaction([
            this.prisma.doctor.update({
                where: { usuarioId },
                data: {
                    estado: 'Eliminado',
                    actualizadoEn: new Date()
                },
            }),
            this.prisma.usuario.update({
                where: { id: usuarioId },
                data: { estado: 'Inactivo' },
            }),
        ]);
    }
    async existePorExequatur(exequatur, excluirUsuarioId) {
        const where = {
            exequatur: exequatur,
        };
        if (excluirUsuarioId) {
            where.usuarioId = { not: excluirUsuarioId };
        }
        const count = await this.prisma.doctor.count({ where });
        return count > 0;
    }
    async existePorDocumento(numeroDocumento, excluirUsuarioId) {
        const where = {
            numeroDocumentoIdentificacion: numeroDocumento,
        };
        if (excluirUsuarioId) {
            where.usuarioId = { not: excluirUsuarioId };
        }
        const count = await this.prisma.doctor.count({ where });
        return count > 0;
    }
    // ────────────────────────────────────────────────────────────────────────────
    // Buscar doctores — con o sin filtro geográfico (PostGIS opcional)
    // ────────────────────────────────────────────────────────────────────────────
    async buscarCercanos(lat, lng, radioKm, filtros, pacienteId, centroId) {
        const useGeo = lat != null && lng != null && radioKm != null;
        const radioMetros = useGeo ? radioKm * 1000 : 0;
        // Rangos de turno en formato HH:MM
        const turnoRanges = {
            manana: ['06:00', '12:00'],
            tarde: ['12:00', '18:00'],
            noche: ['18:00', '24:00'],
        };
        // ── Condiciones SQL opcionales ──────────────────────────────────────────
        const condiciones = [];
        if (filtros?.especialidadId) {
            condiciones.push(client_1.Prisma.sql `
                EXISTS (
                    SELECT 1 FROM doctores_especialidades de2
                    WHERE de2.id_doctor = d.id_usuario
                      AND de2.id_especialidad = ${filtros.especialidadId}
                      AND de2.estado = 'Activo'
                )
            `);
        }
        if (filtros?.genero) {
            condiciones.push(client_1.Prisma.sql `d.genero = ${filtros.genero}`);
        }
        if (filtros?.calificacionMin !== undefined) {
            condiciones.push(client_1.Prisma.sql `d.calificacion_promedio >= ${filtros.calificacionMin}`);
        }
        if (filtros?.nombre) {
            const termino = `%${filtros.nombre}%`;
            condiciones.push(client_1.Prisma.sql `
                (
                    LOWER(d.nombre)    ILIKE LOWER(${termino})
                    OR LOWER(d.apellido) ILIKE LOWER(${termino})
                    OR EXISTS (
                        SELECT 1 FROM doctores_especialidades de3
                        JOIN especialidades e ON e.id_especialidad = de3.id_especialidad
                        WHERE de3.id_doctor = d.id_usuario
                          AND LOWER(e.nombre) ILIKE LOWER(${termino})
                          AND de3.estado = 'Activo'
                    )
                )
            `);
        }
        if (filtros?.idioma) {
            condiciones.push(client_1.Prisma.sql `
                EXISTS (
                    SELECT 1 FROM doctores_idiomas di2
                    WHERE di2.id_doctor = d.id_usuario
                      AND LOWER(di2.nombre) = LOWER(${filtros.idioma})
                      AND di2.estado = 'Activo'
                )
            `);
        }
        if (filtros?.anosExperienciaMin !== undefined) {
            condiciones.push(client_1.Prisma.sql `d.anos_experiencia >= ${filtros.anosExperienciaMin}`);
        }
        if (filtros?.turno && turnoRanges[filtros.turno]) {
            const [horaMin, horaMax] = turnoRanges[filtros.turno];
            condiciones.push(client_1.Prisma.sql `
                EXISTS (
                    SELECT 1 FROM horarios h
                    WHERE h.id_usuario = d.id_usuario
                      AND h.estado = 'Activo'
                      AND h.hora_inicio::time >= ${horaMin}::time
                      AND h.hora_inicio::time < ${horaMax}::time
                )
            `);
        }
        if (filtros?.modalidad) {
            condiciones.push(client_1.Prisma.sql `
                EXISTS (
                    SELECT 1 FROM servicios sv
                    WHERE sv.id_doctor = d.id_usuario
                      AND sv.estado = 'Activo'
                      AND sv.modalidad = ${filtros.modalidad}
                )
            `);
        }
        if (filtros?.seguroId) {
            condiciones.push(client_1.Prisma.sql `
                EXISTS (
                    SELECT 1 FROM doctores_seguros ds2
                    WHERE ds2.id_usuario = d.id_usuario
                      AND ds2.id_seguro = ${filtros.seguroId}
                      AND ds2.estado = 'Activo'
                )
            `);
        }
        const extraWhere = condiciones.length > 0
            ? client_1.Prisma.sql `AND ${client_1.Prisma.join(condiciones, ' AND ')}`
            : client_1.Prisma.sql ``;
        // ── Raw SQL: obtener IDs (y distancia si hay geo) ──────────────────────
        let rows;
        if (useGeo) {
            rows = await this.prisma.$queryRaw `
                SELECT DISTINCT ON (d.id_usuario)
                    d.id_usuario AS id,
                    ST_Distance(
                        u.punto_geografico::geography,
                        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
                    ) AS distancia_metros
                FROM doctores d
                JOIN ubicaciones u
                    ON  u.id_doctor          = d.id_usuario
                    AND u.estado             = 'Activo'
                    AND u.punto_geografico IS NOT NULL
                WHERE d.estado              = 'Activo'
                  AND d.estado_verificacion = 'Aprobado'
                  AND ST_DWithin(
                        u.punto_geografico::geography,
                        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
                        ${radioMetros}
                      )
                ${extraWhere}
                ORDER BY d.id_usuario, distancia_metros ASC
            `;
        }
        else {
            rows = await this.prisma.$queryRaw `
                SELECT DISTINCT d.id_usuario AS id, NULL::double precision AS distancia_metros
                FROM doctores d
                WHERE d.estado              = 'Activo'
                  AND d.estado_verificacion = 'Aprobado'
                ${extraWhere}
                ORDER BY d.id_usuario
            `;
        }
        if (rows.length === 0)
            return [];
        // Mapa id → distancia
        const distanciaMap = new Map();
        for (const r of rows) {
            distanciaMap.set(Number(r.id), r.distancia_metros != null ? Number(r.distancia_metros) : null);
        }
        const idsOrdenados = useGeo
            ? [...distanciaMap.entries()].sort((a, b) => (a[1] ?? 0) - (b[1] ?? 0)).map(([id]) => id)
            : [...distanciaMap.keys()];
        // ── Carga batch de datos completos ────────────────────────────────────
        const doctores = await this.prisma.doctor.findMany({
            where: { usuarioId: { in: idsOrdenados } },
            include: {
                usuario: {
                    select: { email: true, telefono: true, fotoPerfil: true },
                },
                especialidades: {
                    where: { estado: 'Activo' },
                    include: { especialidades: true },
                },
                ubicaciones: {
                    where: { estado: { not: 'Eliminado' } },
                },
                idiomas: {
                    where: { estado: 'Activo' },
                    select: { id: true, nombre: true, nivel: true },
                    orderBy: { nombre: 'asc' },
                },
                servicios: {
                    where: { estado: 'Activo' },
                    select: {
                        id: true, nombre: true, precio: true,
                        duracionMinutos: true, modalidad: true,
                        servicios_ubicaciones: {
                            where: { estado: 'Activo' },
                            include: {
                                ubicacion: {
                                    select: {
                                        id: true, direccion: true, nombre: true, codigoPostal: true,
                                        barrio: { select: { id: true, nombre: true } },
                                    },
                                },
                            },
                        },
                    },
                },
                segurosAceptados: {
                    where: { estado: 'Activo' },
                    include: {
                        seguro: { select: { id: true, nombre: true, urlImage: true } },
                        tipoSeguro: { select: { id: true, nombre: true } },
                    },
                },
                _count: {
                    select: { resenas: { where: { estado: 'Publicada' } } },
                },
            },
        });
        // ── Enriquecer ubicaciones con coords PostGIS ──────────────────────────
        const ubicacionIds = [];
        for (const d of doctores) {
            for (const s of d.servicios ?? []) {
                for (const su of s.servicios_ubicaciones ?? []) {
                    if (su.ubicacion?.id)
                        ubicacionIds.push(su.ubicacion.id);
                }
            }
        }
        if (ubicacionIds.length > 0) {
            const geoRows = await this.prisma.$queryRaw `
                SELECT
                    u.id_ubicacion                        AS id,
                    ST_Y(u.punto_geografico::geometry)    AS latitud,
                    ST_X(u.punto_geografico::geometry)    AS longitud,
                    b.nombre                              AS barrio_nombre,
                    m.nombre                              AS municipio_nombre,
                    p.nombre                              AS provincia_nombre
                FROM ubicaciones u
                LEFT JOIN barrios              b  ON b.id_barrio             = u.id_barrio
                LEFT JOIN secciones            s  ON s.id_seccion             = b.id_seccion
                LEFT JOIN distritos_municipales dm ON dm.id_distrito_municipal = s.id_distrito_municipal
                LEFT JOIN municipios           m  ON m.id_municipio           = COALESCE(dm.id_municipio, s.id_municipio)
                LEFT JOIN provincias           p  ON p.id_provincia           = m.id_provincia
                WHERE u.id_ubicacion IN (${client_1.Prisma.join(ubicacionIds)})
            `;
            const geoMap = new Map();
            for (const row of geoRows)
                geoMap.set(Number(row.id), row);
            for (const d of doctores) {
                for (const s of d.servicios ?? []) {
                    for (const su of s.servicios_ubicaciones ?? []) {
                        if (!su.ubicacion?.id)
                            continue;
                        const geo = geoMap.get(su.ubicacion.id);
                        if (!geo)
                            continue;
                        if (geo.latitud != null)
                            su.ubicacion.latitud = Number(geo.latitud);
                        if (geo.longitud != null)
                            su.ubicacion.longitud = Number(geo.longitud);
                        const partes = [];
                        if (su.ubicacion.direccion)
                            partes.push(su.ubicacion.direccion.trim());
                        if (geo.barrio_nombre)
                            partes.push(geo.barrio_nombre.trim());
                        if (geo.municipio_nombre)
                            partes.push(geo.municipio_nombre.trim());
                        if (geo.provincia_nombre)
                            partes.push(geo.provincia_nombre.trim());
                        su.ubicacion.direccionCompleta = partes.join(', ');
                    }
                }
            }
        }
        // ── Alianzas del centro con cada doctor ────────────────────────────────
        // Cuando el usuario autenticado es un Centro de Salud, se consultan sus
        // solicitudes de alianza con los doctores del resultado.
        const alianzaMap = new Map();
        if (centroId !== undefined) {
            const alianzas = await this.prisma.solicitudAlianza.findMany({
                where: { centroSaludId: centroId, doctorId: { in: idsOrdenados } },
                select: { id: true, doctorId: true, estado: true },
                orderBy: { creadoEn: 'desc' },
            });
            for (const a of alianzas) {
                if (!alianzaMap.has(a.doctorId)) {
                    alianzaMap.set(a.doctorId, { id: a.id, estado: a.estado });
                }
            }
        }
        // ── Favoritos del paciente ─────────────────────────────────────────────
        const favoritosSet = new Set();
        if (pacienteId) {
            const favRows = await this.prisma.doctorFavorito.findMany({
                where: { pacienteId, doctorId: { in: idsOrdenados }, estado: 'Activo' },
                select: { doctorId: true },
            });
            for (const fav of favRows)
                favoritosSet.add(fav.doctorId);
        }
        // ── Mapear y ordenar ───────────────────────────────────────────────────
        const doctoresMap = new Map();
        for (const d of doctores)
            doctoresMap.set(d.usuarioId, d);
        let resultado = idsOrdenados
            .map(id => {
            const d = doctoresMap.get(id);
            if (!d)
                return null;
            const distancia = distanciaMap.get(id);
            return {
                ...d,
                calificacionPromedio: d.calificacionPromedio != null ? Number(d.calificacionPromedio) : null,
                tarifas: d.tarifas != null ? Number(d.tarifas) : null,
                cantidadResenas: d._count?.resenas ?? 0,
                esFavorito: pacienteId ? favoritosSet.has(id) : false,
                estaConectado: centroId !== undefined ? (alianzaMap.get(id)?.estado === 'Aceptada') : false,
                estadoAlianza: centroId !== undefined ? (alianzaMap.get(id)?.estado ?? null) : null,
                solicitudAlianzaId: centroId !== undefined ? (alianzaMap.get(id)?.id ?? null) : null,
                servicios: (d.servicios ?? []).map((s) => ({
                    ...s,
                    precio: s.precio != null ? Number(s.precio) : null,
                })),
                distanciaMetros: distancia != null ? Math.round(distancia) : null,
            };
        })
            .filter(Boolean);
        // soloFavoritos post-filter (después de esFavorito calculado)
        if (filtros?.soloFavoritos && pacienteId) {
            resultado = resultado.filter((d) => d.esFavorito === true);
        }
        return resultado;
    }
}
exports.PrismaDoctorRepository = PrismaDoctorRepository;
