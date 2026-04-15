import { prisma } from '../../infrastructure/database/prisma/client';
import {
    PeriodoEstadistica,
    RangoFechas,
    ResumenKpiDto,
    ConsultasChartDto,
    UsuariosChartDto,
    ServiciosDistribucionDto,
    TipoConsultaDto,
    TopEspecialidadesDto,
    PuntoTemporalDto,
} from '../dtos/EstadisticasAdminDtos';

// ─── Helpers de periodo ───────────────────────────────────────────────────────

const DIAS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function resolverRango(periodo: PeriodoEstadistica): RangoFechas {
    const ahora = new Date();
    const inicio = new Date(ahora);

    switch (periodo) {
        case 'semana':
            inicio.setDate(ahora.getDate() - 6);
            inicio.setHours(0, 0, 0, 0);
            break;
        case 'mes':
            inicio.setDate(ahora.getDate() - 29);
            inicio.setHours(0, 0, 0, 0);
            break;
        case '3meses':
            inicio.setMonth(ahora.getMonth() - 3);
            inicio.setHours(0, 0, 0, 0);
            break;
        case 'año':
            inicio.setMonth(0, 1);
            inicio.setHours(0, 0, 0, 0);
            break;
        case 'todo':
        default:
            return { inicio: new Date(0), fin: new Date(ahora.getTime() + 86400000) };
    }

    return { inicio, fin: new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59) };
}

/** Rango equivalente pero del "periodo anterior" para comparación en KPIs */
function resolverRangoAnterior(periodo: PeriodoEstadistica): RangoFechas | null {
    const ahora = new Date();

    switch (periodo) {
        case 'semana': {
            const fin = new Date(ahora);
            fin.setDate(ahora.getDate() - 7);
            fin.setHours(23, 59, 59);
            const inicio = new Date(fin);
            inicio.setDate(fin.getDate() - 6);
            inicio.setHours(0, 0, 0, 0);
            return { inicio, fin };
        }
        case 'mes': {
            const fin = new Date(ahora);
            fin.setDate(ahora.getDate() - 30);
            fin.setHours(23, 59, 59);
            const inicio = new Date(fin);
            inicio.setDate(fin.getDate() - 29);
            inicio.setHours(0, 0, 0, 0);
            return { inicio, fin };
        }
        case '3meses': {
            const fin = new Date(ahora);
            fin.setMonth(ahora.getMonth() - 3);
            fin.setHours(23, 59, 59);
            const inicio = new Date(fin);
            inicio.setMonth(fin.getMonth() - 3);
            inicio.setHours(0, 0, 0, 0);
            return { inicio, fin };
        }
        case 'año': {
            const anoPasado = ahora.getFullYear() - 1;
            return {
                inicio: new Date(anoPasado, 0, 1, 0, 0, 0),
                fin: new Date(anoPasado, 11, 31, 23, 59, 59),
            };
        }
        case 'todo':
        default:
            return null;
    }
}

function calcularCambioPorcentaje(actual: number, anterior: number): number {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return Math.round(((actual - anterior) / anterior) * 100 * 10) / 10;
}

// ─── Agrupación temporal adaptativa ──────────────────────────────────────────

interface RegistroConFecha { fechaInicio?: Date; creadoEn?: Date }

function agruparPorPeriodo(registros: RegistroConFecha[], periodo: PeriodoEstadistica, campoFecha: 'fechaInicio' | 'creadoEn'): PuntoTemporalDto[] {
    const ahora = new Date();

    if (periodo === 'semana') {
        // 7 días — etiqueta: nombre del día
        const dias: PuntoTemporalDto[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(ahora);
            d.setDate(ahora.getDate() - i);
            dias.push({
                etiqueta: DIAS_ES[d.getDay()],
                fecha: d.toISOString().split('T')[0],
                total: 0,
            });
        }
        for (const r of registros) {
            const f = r[campoFecha]!;
            const key = f.toISOString().split('T')[0];
            const slot = dias.find((d) => d.fecha === key);
            if (slot) slot.total++;
        }
        return dias;
    }

    if (periodo === 'mes') {
        // 30 días agrupados en semanas o días
        const semanas: Map<string, PuntoTemporalDto> = new Map();
        for (const r of registros) {
            const f = r[campoFecha]!;
            // Agrupar por semana del año
            const startOfWeek = new Date(f);
            startOfWeek.setDate(f.getDate() - f.getDay());
            const key = startOfWeek.toISOString().split('T')[0];
            const label = `${startOfWeek.getDate()} ${MESES_ES[startOfWeek.getMonth()]}`;
            if (!semanas.has(key)) {
                semanas.set(key, { etiqueta: label, fecha: key, total: 0 });
            }
            semanas.get(key)!.total++;
        }
        return Array.from(semanas.values()).sort((a, b) => a.fecha!.localeCompare(b.fecha!));
    }

    if (periodo === '3meses') {
        // Últimos 3 meses — por semana
        const semanas: Map<string, PuntoTemporalDto> = new Map();
        for (const r of registros) {
            const f = r[campoFecha]!;
            const startOfWeek = new Date(f);
            startOfWeek.setDate(f.getDate() - f.getDay());
            const key = startOfWeek.toISOString().split('T')[0];
            const label = `${startOfWeek.getDate()} ${MESES_ES[startOfWeek.getMonth()]}`;
            if (!semanas.has(key)) {
                semanas.set(key, { etiqueta: label, fecha: key, total: 0 });
            }
            semanas.get(key)!.total++;
        }
        return Array.from(semanas.values()).sort((a, b) => a.fecha!.localeCompare(b.fecha!));
    }

    if (periodo === 'año') {
        // Por mes del año actual — siempre 12 puntos
        const meses = MESES_ES.map((nombre, i) => ({
            etiqueta: nombre,
            fecha: `${ahora.getFullYear()}-${String(i + 1).padStart(2, '0')}`,
            total: 0,
        }));
        for (const r of registros) {
            const f = r[campoFecha]!;
            if (f.getFullYear() === ahora.getFullYear()) {
                meses[f.getMonth()].total++;
            }
        }
        return meses;
    }

    // todo — por año
    const años: Map<number, PuntoTemporalDto> = new Map();
    for (const r of registros) {
        const f = r[campoFecha]!;
        const y = f.getFullYear();
        if (!años.has(y)) {
            años.set(y, { etiqueta: String(y), total: 0 });
        }
        años.get(y)!.total++;
    }
    return Array.from(años.entries())
        .sort(([a], [b]) => a - b)
        .map(([, v]) => v);
}

// ─── Use Case ─────────────────────────────────────────────────────────────────

export class EstadisticasAdminUseCase {
    /**
     * KPIs: totales de pacientes, doctores y centros de salud
     * con comparación vs el periodo equivalente anterior.
     */
    async obtenerResumen(periodo: PeriodoEstadistica = 'mes'): Promise<ResumenKpiDto> {
        const rango = resolverRango(periodo);
        const rangoAnterior = resolverRangoAnterior(periodo);

        const [totalPacientes, totalDoctores, totalCentros] = await Promise.all([
            prisma.paciente.count(),
            prisma.doctor.count(),
            prisma.centroSalud.count(),
        ]);

        let pacientesPeriodo = 0, doctoresPeriodo = 0, centrosPeriodo = 0;
        let pacientesAnterior = 0, doctoresAnterior = 0, centrosAnterior = 0;

        if (periodo !== 'todo') {
            [pacientesPeriodo, doctoresPeriodo, centrosPeriodo] = await Promise.all([
                prisma.paciente.count({ where: { creadoEn: { gte: rango.inicio, lte: rango.fin } } }),
                prisma.doctor.count({ where: { creadoEn: { gte: rango.inicio, lte: rango.fin } } }),
                prisma.centroSalud.count({ where: { creadoEn: { gte: rango.inicio, lte: rango.fin } } }),
            ]);

            if (rangoAnterior) {
                [pacientesAnterior, doctoresAnterior, centrosAnterior] = await Promise.all([
                    prisma.paciente.count({ where: { creadoEn: { gte: rangoAnterior.inicio, lte: rangoAnterior.fin } } }),
                    prisma.doctor.count({ where: { creadoEn: { gte: rangoAnterior.inicio, lte: rangoAnterior.fin } } }),
                    prisma.centroSalud.count({ where: { creadoEn: { gte: rangoAnterior.inicio, lte: rangoAnterior.fin } } }),
                ]);
            }
        }

        return {
            pacientes: {
                total: totalPacientes,
                totalPeriodoAnterior: pacientesAnterior,
                cambioPorcentaje: calcularCambioPorcentaje(pacientesPeriodo, pacientesAnterior),
            },
            doctores: {
                total: totalDoctores,
                totalPeriodoAnterior: doctoresAnterior,
                cambioPorcentaje: calcularCambioPorcentaje(doctoresPeriodo, doctoresAnterior),
            },
            centrosSalud: {
                total: totalCentros,
                totalPeriodoAnterior: centrosAnterior,
                cambioPorcentaje: calcularCambioPorcentaje(centrosPeriodo, centrosAnterior),
            },
        };
    }

    /**
     * Consultas (citas) agrupadas con granularidad adaptativa al periodo.
     */
    async obtenerConsultas(periodo: PeriodoEstadistica = 'año'): Promise<ConsultasChartDto> {
        const rango = resolverRango(periodo);

        const citas = await prisma.cita.findMany({
            where: {
                fechaInicio: {
                    ...(periodo !== 'todo' ? { gte: rango.inicio } : {}),
                    lte: rango.fin,
                },
            },
            select: { fechaInicio: true },
        });

        const datos = agruparPorPeriodo(citas, periodo, 'fechaInicio');
        return { periodo, datos };
    }

    /**
     * Usuarios registrados agrupados con granularidad adaptativa al periodo.
     */
    async obtenerUsuarios(periodo: PeriodoEstadistica = 'año'): Promise<UsuariosChartDto> {
        const rango = resolverRango(periodo);

        const usuarios = await prisma.usuario.findMany({
            where: {
                creadoEn: {
                    ...(periodo !== 'todo' ? { gte: rango.inicio } : {}),
                    lte: rango.fin,
                },
            },
            select: { creadoEn: true },
        });

        const adaptados = usuarios.map((u) => ({ fechaInicio: u.creadoEn }));
        const datos = agruparPorPeriodo(adaptados, periodo, 'fechaInicio');
        return { periodo, datos };
    }

    /**
     * Distribución de servicios en citas (gráfico de torta).
     */
    async obtenerServiciosDistribucion(periodo: PeriodoEstadistica = 'año', limite = 8): Promise<ServiciosDistribucionDto> {
        const rango = resolverRango(periodo);

        const grupos = await prisma.cita.groupBy({
            by: ['servicioId'],
            where: {
                fechaInicio: {
                    ...(periodo !== 'todo' ? { gte: rango.inicio } : {}),
                    lte: rango.fin,
                },
            },
            _count: { servicioId: true },
            orderBy: { _count: { servicioId: 'desc' } },
            take: limite,
        });

        const servicioIds = grupos.map((g) => g.servicioId);
        const servicios = await prisma.servicio.findMany({
            where: { id: { in: servicioIds } },
            select: { id: true, nombre: true },
        });

        const mapaServicios = new Map(servicios.map((s) => [s.id, s.nombre]));
        const totalCitas = grupos.reduce((acc, g) => acc + g._count.servicioId, 0);

        return {
            totalCitas,
            datos: grupos.map((g) => ({
                nombre: mapaServicios.get(g.servicioId) ?? 'Sin nombre',
                total: g._count.servicioId,
                porcentaje: totalCitas > 0
                    ? Math.round((g._count.servicioId / totalCitas) * 100 * 10) / 10
                    : 0,
            })),
        };
    }

    /**
     * Tipo de consulta: presencial vs teleconsulta (gráfico de torta).
     */
    async obtenerTipoConsulta(periodo: PeriodoEstadistica = 'año'): Promise<TipoConsultaDto> {
        const rango = resolverRango(periodo);

        const grupos = await prisma.cita.groupBy({
            by: ['modalidad'],
            where: {
                fechaInicio: {
                    ...(periodo !== 'todo' ? { gte: rango.inicio } : {}),
                    lte: rango.fin,
                },
            },
            _count: { modalidad: true },
        });

        let presencial = 0;
        let teleconsulta = 0;

        for (const g of grupos) {
            if (g.modalidad === 'Teleconsulta') {
                teleconsulta = g._count.modalidad;
            } else {
                presencial += g._count.modalidad;
            }
        }

        const totalCitas = presencial + teleconsulta;

        return {
            presencial,
            teleconsulta,
            totalCitas,
            porcentajePresencial: totalCitas > 0 ? Math.round((presencial / totalCitas) * 100 * 10) / 10 : 0,
            porcentajeTeleconsulta: totalCitas > 0 ? Math.round((teleconsulta / totalCitas) * 100 * 10) / 10 : 0,
        };
    }

    /**
     * Top especialidades por calificación promedio de reseñas.
     */
    async obtenerTopEspecialidades(limite = 5): Promise<TopEspecialidadesDto> {
        // Obtener reseñas activas con calificación y doctor_id
        const resenas = await prisma.resena.findMany({
            where: { estado: { in: ['Publicada', 'Activo'] } },
            select: {
                calificacion: true,
                doctorId: true,
            },
        });

        if (resenas.length === 0) return { datos: [] };

        // Obtener la especialidad principal de cada doctor involucrado
        const doctorIds = [...new Set(resenas.map((r) => r.doctorId))];

        const relaciones = await prisma.doctorEspecialidad.findMany({
            where: {
                id_doctor: { in: doctorIds },
                estado: 'Activo',
            },
            select: {
                id_doctor: true,
                especialidades: { select: { nombre: true } },
            },
        });

        // Mapa doctorId → nombre de especialidad principal (primer activo)
        const mapaDoctor = new Map<number, string>();
        for (const rel of relaciones) {
            if (!mapaDoctor.has(rel.id_doctor)) {
                mapaDoctor.set(rel.id_doctor, rel.especialidades.nombre);
            }
        }

        // Agrupar calificaciones por especialidad
        const mapaEsp = new Map<string, { suma: number; count: number }>();
        for (const r of resenas) {
            const esp = mapaDoctor.get(r.doctorId);
            if (!esp) continue;
            const entry = mapaEsp.get(esp) ?? { suma: 0, count: 0 };
            entry.suma += r.calificacion;
            entry.count++;
            mapaEsp.set(esp, entry);
        }

        const result = Array.from(mapaEsp.entries())
            .map(([nombre, { suma, count }]) => ({
                nombre,
                calificacionPromedio: Math.round((suma / count) * 10) / 10,
                totalResenas: count,
            }))
            .sort((a, b) => b.calificacionPromedio - a.calificacionPromedio)
            .slice(0, limite);

        return { datos: result };
    }
}
