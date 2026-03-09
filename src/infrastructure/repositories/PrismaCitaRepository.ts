import { PrismaClient, Prisma } from '@prisma/client';
import { ICitaRepository } from '../../domain/repositories/ICitaRepository';

const CITA_INCLUDE = {
    paciente: {
        include: {
            usuario: {
                select: { email: true, telefono: true, fotoPerfil: true },
            },
            // Alergias y condiciones médicas del paciente
            caracteristicas: {
                where: { estado: 'Activo' },
                include: {
                    condicion: {
                        select: { id: true, nombre: true, tipo: true, descripcion: true },
                    },
                },
                orderBy: { registradoEn: 'asc' as const },
            },
        },
    },
    doctor: {
        include: {
            usuario: {
                select: { email: true, telefono: true, fotoPerfil: true },
            },
            especialidades: {
                where: { es_principal: true },
                include: { especialidades: { select: { id: true, nombre: true } } },
            },
        },
    },
    servicio: {
        include: {
            especialidad: { select: { id: true, nombre: true } },
            imagenes: { where: { estado: 'Activo' }, orderBy: { orden: 'asc' as const } },
        },
    },
    horario: true,
    seguro: { select: { id: true, nombre: true, urlImage: true } },
    tipoSeguro: { select: { id: true, nombre: true } },
    ubicacion: {
        include: {
            barrio: { select: { id: true, nombre: true } },
        },
    },
    historial: {
        include: { adjuntos: { include: { media: true } } },
    },
} as any;

export class PrismaCitaRepository implements ICitaRepository {
    constructor(private prisma: PrismaClient) { }

    async crear(datos: {
        pacienteId: number;
        doctorId: number;
        servicioId: number;
        horarioId?: number;
        fechaInicio: Date;
        duracionMinutos?: number;
        modalidad: string;
        numPacientes: number;
        seguroId?: number;
        tipoSeguroId?: number;
        motivoConsulta?: string;
        totalAPagar: number;
        ubicacionId?: number;
        grupoId?: number;
    }): Promise<any> {
        // Calcular fechaFin en base a la duración del servicio
        const duracion = datos.duracionMinutos ?? 30;
        const fechaFin = new Date(datos.fechaInicio.getTime() + duracion * 60 * 1000);

        const cita = await (this.prisma.cita as any).create({
            data: {
                pacienteId: datos.pacienteId,
                doctorUsuarioId: datos.doctorId,
                servicioId: datos.servicioId,
                horarioId: datos.horarioId ?? null,
                fechaInicio: datos.fechaInicio,
                fechaFin,
                modalidad: datos.modalidad,
                numPacientes: datos.numPacientes,
                seguroId: datos.seguroId ?? null,
                tipoSeguroId: datos.tipoSeguroId ?? null,
                motivoConsulta: datos.motivoConsulta ?? null,
                totalAPagar: datos.totalAPagar,
                ubicacionId: datos.ubicacionId ?? null,
                id_grupo: datos.grupoId ?? null,
                estado: 'Programada',
            },
            include: CITA_INCLUDE,
        });
        return this._mapCita(cita);
    }

    async buscarPorId(id: number): Promise<any | null> {
        const cita = await (this.prisma.cita as any).findUnique({
            where: { id },
            include: CITA_INCLUDE,
        });
        return cita ? this._mapCita(cita) : null;
    }

    async listarPorPaciente(
        pacienteId: number,
        filtros: { estado?: string; pagina?: number; limite?: number; fechaDesde?: Date; fechaHasta?: Date }
    ): Promise<{ datos: any[]; total: number }> {
        const pagina = filtros.pagina ?? 1;
        const limite = filtros.limite ?? 10;
        const skip = (pagina - 1) * limite;

        const where: any = { pacienteId };
        if (filtros.estado) where.estado = filtros.estado;
        if (filtros.fechaDesde || filtros.fechaHasta) {
            where.fechaInicio = {};
            if (filtros.fechaDesde) where.fechaInicio.gte = filtros.fechaDesde;
            if (filtros.fechaHasta) where.fechaInicio.lte = filtros.fechaHasta;
        }

        const [datos, total] = await Promise.all([
            (this.prisma.cita as any).findMany({
                where,
                include: CITA_INCLUDE,
                orderBy: { fechaInicio: 'desc' },
                skip,
                take: limite,
            }),
            (this.prisma.cita as any).count({ where }),
        ]);

        return { datos: datos.map((c: any) => this._mapCita(c)), total };
    }

    async listarPorDoctor(
        doctorId: number,
        filtros: { estado?: string; pagina?: number; limite?: number; fechaDesde?: Date; fechaHasta?: Date }
    ): Promise<{ datos: any[]; total: number }> {
        const pagina = filtros.pagina ?? 1;
        const limite = filtros.limite ?? 10;
        const skip = (pagina - 1) * limite;

        const where: any = { doctorUsuarioId: doctorId };
        if (filtros.estado) where.estado = filtros.estado;
        if (filtros.fechaDesde || filtros.fechaHasta) {
            where.fechaInicio = {};
            if (filtros.fechaDesde) where.fechaInicio.gte = filtros.fechaDesde;
            if (filtros.fechaHasta) where.fechaInicio.lte = filtros.fechaHasta;
        }

        const [citas, total] = await Promise.all([
            (this.prisma.cita as any).findMany({
                where,
                include: CITA_INCLUDE,
                orderBy: { fechaInicio: 'asc' },
                skip,
                take: limite,
            }),
            (this.prisma.cita as any).count({ where }),
        ]);

        // ── Enriquecer ubicaciones de citas con coords + dirección completa ──
        const ubicacionIds: number[] = citas
            .map((c: any) => c.ubicacionId)
            .filter((id: any): id is number => id != null);

        if (ubicacionIds.length > 0) {
            const uniqueIds = [...new Set(ubicacionIds)];
            const geoRows = await this.prisma.$queryRaw<{
                id: number;
                latitud: number | null;
                longitud: number | null;
                barrio_nombre: string | null;
                municipio_nombre: string | null;
                provincia_nombre: string | null;
            }[]>`
                SELECT
                    u.id_ubicacion                        AS id,
                    ST_Y(u.punto_geografico::geometry)    AS latitud,
                    ST_X(u.punto_geografico::geometry)    AS longitud,
                    b.nombre                              AS barrio_nombre,
                    m.nombre                              AS municipio_nombre,
                    p.nombre                              AS provincia_nombre
                FROM ubicaciones u
                LEFT JOIN barrios               b  ON b.id_barrio              = u.id_barrio
                LEFT JOIN secciones             s  ON s.id_seccion              = b.id_seccion
                LEFT JOIN distritos_municipales dm ON dm.id_distrito_municipal  = s.id_distrito_municipal
                LEFT JOIN municipios            m  ON m.id_municipio            = COALESCE(dm.id_municipio, s.id_municipio)
                LEFT JOIN provincias            p  ON p.id_provincia            = m.id_provincia
                WHERE u.id_ubicacion IN (${Prisma.join(uniqueIds)})
            `;

            const geoMap = new Map<number, typeof geoRows[0]>();
            for (const row of geoRows) geoMap.set(Number(row.id), row);

            for (const cita of citas) {
                if (!cita.ubicacion || !cita.ubicacionId) continue;
                const geo = geoMap.get(cita.ubicacionId);
                if (!geo) continue;

                if (geo.latitud != null) cita.ubicacion.latitud = Number(geo.latitud);
                if (geo.longitud != null) cita.ubicacion.longitud = Number(geo.longitud);

                const partes: string[] = [];
                if (cita.ubicacion.direccion) partes.push(cita.ubicacion.direccion.trim());
                if (geo.barrio_nombre) partes.push(geo.barrio_nombre.trim());
                if (geo.municipio_nombre) partes.push(geo.municipio_nombre.trim());
                if (geo.provincia_nombre) partes.push(geo.provincia_nombre.trim());
                cita.ubicacion.direccionCompleta = partes.join(', ');
            }
        }

        return { datos: citas.map((c: any) => this._mapCita(c)), total };
    }

    async actualizar(id: number, datos: any): Promise<any> {
        const cita = await (this.prisma.cita as any).update({
            where: { id },
            data: { ...datos, actualizadoEn: new Date() },
            include: CITA_INCLUDE,
        });
        return this._mapCita(cita);
    }

    // ─── Mapper: añade campos de fecha/hora separados ─────────────────────────
    private _mapCita(cita: any): any {
        const toN = (v: any) => v != null ? Number(v) : null;
        const toDateStr = (d: Date) => d.toISOString().substring(0, 10);   // "YYYY-MM-DD"
        const toTimeStr = (d: Date) => d.toISOString().substring(11, 16);  // "HH:MM"

        // ── Fechas de la cita ────────────────────────────
        const inicioDate = new Date(cita.fechaInicio);
        const duracion = cita.servicio?.duracionMinutos ?? 30;
        const finDate: Date = cita.fechaFin
            ? new Date(cita.fechaFin)
            : new Date(inicioDate.getTime() + duracion * 60 * 1000);

        // ── Horario simplificado ─────────────────────────
        const horario = cita.horario ? {
            id: cita.horario.id,
            nombre: cita.horario.nombre,
            horaInicio: toTimeStr(new Date(cita.horario.horaInicio)),
            horaFin: toTimeStr(new Date(cita.horario.horaFin)),
            ubicacionId: cita.horario.ubicacionId,
            estado: cita.horario.estado,
        } : null;

        // ── Servicio — Decimals a number ─────────────────
        const servicio = cita.servicio ? {
            ...cita.servicio,
            precio: toN(cita.servicio.precio),
            calificacionPromedio: toN(cita.servicio.calificacionPromedio),
        } : null;

        // ── Doctor — calificacionPromedio a number ───────
        const doctor = cita.doctor ? {
            ...cita.doctor,
            calificacionPromedio: toN(cita.doctor.calificacionPromedio),
        } : null;

        // ── Paciente — peso a number + edad calculada ──────
        const calcularEdad = (fechaNac: Date | string): number => {
            const hoy = new Date();
            const nac = new Date(fechaNac);
            let edad = hoy.getFullYear() - nac.getFullYear();
            const diffMes = hoy.getMonth() - nac.getMonth();
            if (diffMes < 0 || (diffMes === 0 && hoy.getDate() < nac.getDate())) edad--;
            return edad;
        };

        const paciente = cita.paciente ? {
            ...cita.paciente,
            peso: toN(cita.paciente.peso),
            edad: cita.paciente.fechaNacimiento
                ? calcularEdad(cita.paciente.fechaNacimiento)
                : null,
        } : null;

        // ── Ensamblar respuesta final ────────────────────
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { fechaInicio: _fi, fechaFin: _ff, horario: _h,
            paciente: _p, doctor: _d, servicio: _s, ...rest } = cita;

        return {
            ...rest,
            fechaInicio: toDateStr(inicioDate),
            horaInicio: toTimeStr(inicioDate),
            fechaFin: toDateStr(finDate),
            horaFin: toTimeStr(finDate),
            totalAPagar: toN(cita.totalAPagar),
            paciente,
            doctor,
            servicio,
            horario,
        };
    }

    /**
     * Retorna todas las citas activas del doctor cuya ventana horaria
     * solapa con el rango [desde, hasta).
     *
     * Para citas con fechaFin = null (todavía no completadas), estimamos
     * el fin como fechaInicio + servicio.duracionMinutos.  Esto permite
     * detectar correctamente solapamientos cuando el doctor tiene varios
     * servicios con distintas duraciones.
     */
    async obtenerCitasEnRango(doctorId: number, desde: Date, hasta: Date): Promise<any[]> {
        // Ventana de seguridad: capturamos citas que empezaron hasta 8h antes
        // para no perder ninguna que pudiera seguir en curso
        const ventanaSeguridad = new Date(desde.getTime() - 8 * 60 * 60 * 1000);

        const citas = await (this.prisma.cita as any).findMany({
            where: {
                doctorUsuarioId: doctorId,
                estado: { in: ['Programada', 'En Progreso', 'Reprogramada'] },
                OR: [
                    // Citas con fechaFin real: solapan si finReal > desde Y inicio < hasta
                    { fechaFin: { not: null, gt: desde }, fechaInicio: { lt: hasta } },
                    // Citas sin fechaFin: pre-filtramos en la ventana de seguridad
                    { fechaFin: null, fechaInicio: { gte: ventanaSeguridad, lt: hasta } },
                ],
            },
            include: {
                servicio: { select: { duracionMinutos: true } },
            },
        });

        // Para las citas sin fechaFin, aplicamos filtro fino con duración estimada
        return citas.filter((cita: any) => {
            if (cita.fechaFin) {
                return true; // Ya se filtró correctamente por la query
            }
            const duracion = cita.servicio?.duracionMinutos ?? 30;
            const finEstimado = new Date(cita.fechaInicio.getTime() + duracion * 60 * 1000);
            // Solapa si: inicio < hasta Y finEstimado > desde
            return cita.fechaInicio < hasta && finEstimado > desde;
        });
    }


    async crearHistorial(datos: {
        citaId: number;
        pacienteId: number;
        resumen: string;
        diagnostico: string;
        tratamiento?: string;
        observacion?: string;
    }): Promise<any> {
        return await this.prisma.historialConsulta.create({
            data: {
                citaId: datos.citaId,
                pacienteId: datos.pacienteId,
                resumen: datos.resumen,
                diagnostico: datos.diagnostico,
                tratamiento: datos.tratamiento ?? null,
                observacion: datos.observacion ?? null,
            },
            include: {
                cita: {
                    include: {
                        doctor: { include: { usuario: { select: { email: true, fotoPerfil: true } } } },
                        servicio: { include: { especialidad: true } },
                    },
                },
                adjuntos: { include: { media: true } },
            },
        });
    }

    async buscarHistorialPorCita(citaId: number): Promise<any | null> {
        return await this.prisma.historialConsulta.findUnique({
            where: { citaId },
            include: {
                cita: {
                    include: {
                        doctor: {
                            include: {
                                usuario: { select: { email: true, fotoPerfil: true } },
                                especialidades: {
                                    where: { es_principal: true },
                                    include: { especialidades: { select: { nombre: true } } },
                                },
                            },
                        },
                        paciente: { include: { usuario: { select: { email: true } } } },
                        servicio: { include: { especialidad: true } },
                        seguro: { select: { nombre: true, urlImage: true } },
                        tipoSeguro: { select: { nombre: true } },
                    },
                },
                adjuntos: { include: { media: true } },
            },
        });
    }

    async listarHistorialPaciente(
        pacienteId: number,
        filtros: { pagina?: number; limite?: number }
    ): Promise<{ datos: any[]; total: number }> {
        const pagina = filtros.pagina ?? 1;
        const limite = filtros.limite ?? 10;
        const skip = (pagina - 1) * limite;

        const [datos, total] = await Promise.all([
            this.prisma.historialConsulta.findMany({
                where: { pacienteId },
                include: {
                    cita: {
                        include: {
                            doctor: {
                                include: {
                                    usuario: { select: { email: true, fotoPerfil: true } },
                                    especialidades: {
                                        where: { es_principal: true },
                                        include: { especialidades: { select: { nombre: true } } },
                                    },
                                },
                            },
                            servicio: { include: { especialidad: true } },
                            seguro: { select: { nombre: true, urlImage: true } },
                            tipoSeguro: { select: { nombre: true } },
                        },
                    },
                    adjuntos: { include: { media: true } },
                },
                orderBy: { creadoEn: 'desc' },
                skip,
                take: limite,
            }),
            this.prisma.historialConsulta.count({ where: { pacienteId } }),
        ]);

        return { datos, total };
    }

    // ─── ESTADÍSTICAS DE PACIENTES ─────────────────────────────────────────────
    async estadisticasPacientes(
        doctorId: number,
        filtros: { fechaDesde?: Date; fechaHasta?: Date; servicioId?: number },
    ): Promise<{
        totalPacientes: number;
        pacientesConCondicionesActivas: number;
        pacientesConAlergias: number;
        edadPromedio: number | null;
    }> {
        // Construcción del where base
        const where: any = { doctorUsuarioId: doctorId };
        if (filtros.servicioId) where.servicioId = filtros.servicioId;
        if (filtros.fechaDesde || filtros.fechaHasta) {
            where.fechaInicio = {};
            if (filtros.fechaDesde) where.fechaInicio.gte = filtros.fechaDesde;
            if (filtros.fechaHasta) where.fechaInicio.lte = filtros.fechaHasta;
        }

        // 1. Obtener pacientes únicos con sus fechas de nacimiento
        const citasConPaciente = await (this.prisma.cita as any).findMany({
            where,
            select: {
                pacienteId: true,
                paciente: { select: { fechaNacimiento: true } },
            },
        });

        // Deduplicar por pacienteId
        const pacienteMap = new Map<number, Date>();
        for (const c of citasConPaciente) {
            if (!pacienteMap.has(c.pacienteId)) {
                pacienteMap.set(c.pacienteId, c.paciente?.fechaNacimiento ?? null);
            }
        }

        const totalPacientes = pacienteMap.size;
        const pacienteIds = [...pacienteMap.keys()];

        if (totalPacientes === 0) {
            return { totalPacientes: 0, pacientesConCondicionesActivas: 0, pacientesConAlergias: 0, edadPromedio: null };
        }

        // 2. Condiciones activas y alergias en una sola query agrupada
        const caracteristicas = await this.prisma.caracteristicaEspecial.findMany({
            where: {
                pacienteId: { in: pacienteIds },
                estado: 'Activo',
            },
            select: {
                pacienteId: true,
                condicion: { select: { tipo: true } },
            },
        });

        // Agrupar por paciente: ¿tiene condición activa? ¿tiene alergia activa?
        const conCondicion = new Set<number>();
        const conAlergia = new Set<number>();
        for (const car of caracteristicas) {
            conCondicion.add(car.pacienteId);
            if (car.condicion?.tipo === 'Alergia') {
                conAlergia.add(car.pacienteId);
            }
        }

        // 3. Calcular edad promedio
        const hoy = new Date();
        let sumaEdades = 0;
        let countEdades = 0;
        for (const [, fechaNac] of pacienteMap) {
            if (!fechaNac) continue;
            const nac = new Date(fechaNac);
            let edad = hoy.getFullYear() - nac.getFullYear();
            const m = hoy.getMonth() - nac.getMonth();
            if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
            sumaEdades += edad;
            countEdades++;
        }
        const edadPromedio = countEdades > 0
            ? Math.round((sumaEdades / countEdades) * 10) / 10
            : null;

        return {
            totalPacientes,
            pacientesConCondicionesActivas: conCondicion.size,
            pacientesConAlergias: conAlergia.size,
            edadPromedio,
        };
    }

    // ─── ESTADÍSTICAS DE CITAS ─────────────────────────────────────────────────
    async estadisticasCitas(
        doctorId: number,
        filtros: { fechaDesde?: Date; fechaHasta?: Date; servicioId?: number },
    ): Promise<{
        totalCitas: number;
        citasProgramadas: number;
        citasCanceladas: number;
        citasCompletadas: number;
    }> {
        const baseWhere: any = { doctorUsuarioId: doctorId };
        if (filtros.servicioId) baseWhere.servicioId = filtros.servicioId;
        if (filtros.fechaDesde || filtros.fechaHasta) {
            baseWhere.fechaInicio = {};
            if (filtros.fechaDesde) baseWhere.fechaInicio.gte = filtros.fechaDesde;
            if (filtros.fechaHasta) baseWhere.fechaInicio.lte = filtros.fechaHasta;
        }

        const [totalCitas, citasProgramadas, citasCanceladas, citasCompletadas] =
            await Promise.all([
                (this.prisma.cita as any).count({ where: baseWhere }),
                (this.prisma.cita as any).count({ where: { ...baseWhere, estado: 'Programada' } }),
                (this.prisma.cita as any).count({ where: { ...baseWhere, estado: 'Cancelada' } }),
                (this.prisma.cita as any).count({ where: { ...baseWhere, estado: 'Completada' } }),
            ]);

        return { totalCitas, citasProgramadas, citasCanceladas, citasCompletadas };
    }

    // ─── RESUMEN GENERAL DEL DOCTOR ───────────────────────────────────────────
    async resumenDoctor(doctorId: number): Promise<{
        totalPacientes: number;
        totalConsultas: number;
        totalDineroGanado: number;
    }> {
        const where: any = { doctorUsuarioId: doctorId };

        // Pacientes únicos + total de consultas completadas en paralelo
        const [citasConPaciente, totalConsultas] = await Promise.all([
            (this.prisma.cita as any).findMany({
                where,
                select: { pacienteId: true },
            }),
            (this.prisma.cita as any).count({ where: { ...where, estado: 'Completada' } }),
        ]);

        // Deduplicar pacientes
        const totalPacientes = new Set<number>(
            (citasConPaciente as { pacienteId: number }[]).map((c) => c.pacienteId)
        ).size;

        // Sumar precios de citas completadas (servicio.precio)
        const citasCompletadas = await (this.prisma.cita as any).findMany({
            where: { ...where, estado: 'Completada' },
            select: { servicio: { select: { precio: true } } },
        });
        const totalDineroGanado = (citasCompletadas as { servicio: { precio: any } | null }[])
            .reduce((sum, c) => sum + (c.servicio?.precio != null ? parseFloat(c.servicio.precio.toString()) : 0), 0);

        return {
            totalPacientes,
            totalConsultas,
            totalDineroGanado: Math.round(totalDineroGanado * 100) / 100,
        };
    }

    // ─── ESTADÍSTICAS DE SERVICIOS DEL DOCTOR ────────────────────────────────
    async estadisticasServicios(doctorId: number): Promise<{
        totalServicios: number;
        serviciosActivos: number;
        serviciosInactivos: number;
        promedioRating: number | null;
    }> {
        const [totalServicios, serviciosActivos, serviciosInactivos, doctor] = await Promise.all([
            this.prisma.servicio.count({ where: { doctorId } }),
            this.prisma.servicio.count({ where: { doctorId, estado: 'Activo' } }),
            this.prisma.servicio.count({ where: { doctorId, estado: 'Inactivo' } }),
            this.prisma.doctor.findUnique({
                where: { usuarioId: doctorId },
                select: { calificacionPromedio: true },
            }),
        ]);

        const promedioRating = doctor?.calificacionPromedio != null
            ? parseFloat(doctor.calificacionPromedio.toString())
            : null;

        return { totalServicios, serviciosActivos, serviciosInactivos, promedioRating };
    }

    // ─── PRODUCTIVIDAD DEL DOCTOR ─────────────────────────────────────────────
    async productividadDoctor(doctorId: number, periodo: string): Promise<{
        periodo: string;
        puntos: { label: string; consultas: number; ingresos: number }[];
        totales: { consultas: number; ingresos: number };
    }> {
        const now = new Date();

        // ── Calcular rango según periodo ────────────────────────────────
        let desde: Date;
        let groupBy: 'dia' | 'semana' | 'mes';

        if (periodo === 'semana') {
            // Últimos 7 días → agrupar por día
            desde = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6));
            groupBy = 'dia';
        } else if (periodo === 'mes') {
            // Mes actual → agrupar por semana del mes
            desde = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
            groupBy = 'semana';
        } else if (periodo === '3meses') {
            // Últimos 3 meses → agrupar por mes
            desde = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1));
            groupBy = 'mes';
        } else if (periodo === 'año') {
            // Últimos 12 meses → agrupar por mes
            desde = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth() + 1, 1));
            groupBy = 'mes';
        } else {
            // 'todo' → desde la primera cita, agrupar por mes
            const primera = await (this.prisma.cita as any).findFirst({
                where: { doctorUsuarioId: doctorId },
                orderBy: { fechaInicio: 'asc' },
                select: { fechaInicio: true },
            });
            desde = primera
                ? new Date(Date.UTC(new Date(primera.fechaInicio).getUTCFullYear(), new Date(primera.fechaInicio).getUTCMonth(), 1))
                : new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
            groupBy = 'mes';
        }

        // ── Obtener citas completadas en el rango ────────────────────────
        const citas = await (this.prisma.cita as any).findMany({
            where: {
                doctorUsuarioId: doctorId,
                estado: 'Completada',
                fechaInicio: { gte: desde },
            },
            select: {
                fechaInicio: true,
                servicio: { select: { precio: true } },
            },
            orderBy: { fechaInicio: 'asc' },
        });

        // ── Generar mapa de puntos vacíos según groupBy ─────────────────
        const puntoMap = new Map<string, { consultas: number; ingresos: number }>();

        const MESES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const DIAS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

        if (groupBy === 'dia') {
            // Generar últimos 7 días como claves
            for (let i = 6; i >= 0; i--) {
                const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
                const label = DIAS_ES[d.getUTCDay()];
                puntoMap.set(d.toISOString().substring(0, 10), { consultas: 0, ingresos: 0 });
                // guardamos con clave ISO, label por separado
                (puntoMap.get(d.toISOString().substring(0, 10)) as any).__label = label;
            }
        } else if (groupBy === 'semana') {
            // Sem 1..4 del mes actual
            for (let sem = 1; sem <= 4; sem++) {
                puntoMap.set(`Sem ${sem}`, { consultas: 0, ingresos: 0 });
            }
        } else {
            // Meses del rango
            const cursor = new Date(desde);
            while (cursor <= now) {
                const key = `${MESES_ES[cursor.getUTCMonth()]} ${cursor.getUTCFullYear()}`;
                puntoMap.set(key, { consultas: 0, ingresos: 0 });
                cursor.setUTCMonth(cursor.getUTCMonth() + 1);
            }
        }

        // ── Distribuir citas en el mapa ──────────────────────────────────
        for (const cita of citas) {
            const fecha = new Date(cita.fechaInicio);
            const precio = cita.servicio?.precio != null ? parseFloat(cita.servicio.precio.toString()) : 0;

            let key: string;
            if (groupBy === 'dia') {
                key = fecha.toISOString().substring(0, 10);
            } else if (groupBy === 'semana') {
                const diaDelMes = fecha.getUTCDate();
                const semNum = Math.min(Math.ceil(diaDelMes / 7), 4);
                key = `Sem ${semNum}`;
            } else {
                key = `${MESES_ES[fecha.getUTCMonth()]} ${fecha.getUTCFullYear()}`;
            }

            const punto = puntoMap.get(key);
            if (punto) {
                punto.consultas++;
                punto.ingresos += precio;
            }
        }

        // ── Construir puntos finales ─────────────────────────────────────
        const puntos = [...puntoMap.entries()].map(([key, val]) => ({
            label: (val as any).__label ?? key,
            consultas: val.consultas,
            ingresos: Math.round(val.ingresos * 100) / 100,
        }));

        const totales = puntos.reduce(
            (acc, p) => ({ consultas: acc.consultas + p.consultas, ingresos: Math.round((acc.ingresos + p.ingresos) * 100) / 100 }),
            { consultas: 0, ingresos: 0 },
        );

        return { periodo, puntos, totales };
    }

    // ─── SERVICIOS MÁS UTILIZADOS ─────────────────────────────────────────────
    async serviciosMasUtilizados(doctorId: number): Promise<{
        masUtilizados: { servicioId: number; nombre: string; totalCitas: number; porcentaje: number }[];
        servicios: { id: number; nombre: string; precio: number | null; estado: string; modalidad: string; totalCitas: number }[];
    }> {
        // Todos los servicios del doctor
        const servicios = await this.prisma.servicio.findMany({
            where: { doctorId },
            select: { id: true, nombre: true, precio: true, estado: true, modalidad: true },
            orderBy: { nombre: 'asc' },
        });

        if (servicios.length === 0) {
            return { masUtilizados: [], servicios: [] };
        }

        // Contar citas por servicio
        const servicioIds = servicios.map((s) => s.id);
        const conteos = await (this.prisma.cita as any).groupBy({
            by: ['servicioId'],
            where: { doctorUsuarioId: doctorId, servicioId: { in: servicioIds } },
            _count: { servicioId: true },
        });

        const conteoMap = new Map<number, number>(
            (conteos as { servicioId: number; _count: { servicioId: number } }[]).map((c) => [c.servicioId, c._count.servicioId])
        );

        const totalCitasGlobal = [...conteoMap.values()].reduce((s, n) => s + n, 0);

        // Armar lista completa de servicios con totalCitas
        const serviciosList = servicios.map((s) => ({
            id: s.id,
            nombre: s.nombre,
            precio: s.precio != null ? parseFloat(s.precio.toString()) : null,
            estado: s.estado,
            modalidad: s.modalidad,
            totalCitas: conteoMap.get(s.id) ?? 0,
        }));

        // Servicios más utilizados ordenados desc por totalCitas
        const masUtilizados = [...serviciosList]
            .filter((s) => s.totalCitas > 0)
            .sort((a, b) => b.totalCitas - a.totalCitas)
            .map((s) => ({
                servicioId: s.id,
                nombre: s.nombre,
                totalCitas: s.totalCitas,
                porcentaje: totalCitasGlobal > 0
                    ? Math.round((s.totalCitas / totalCitasGlobal) * 10000) / 100
                    : 0,
            }));

        return { masUtilizados, servicios: serviciosList };
    }
}

