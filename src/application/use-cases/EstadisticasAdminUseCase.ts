import { prisma } from '../../infrastructure/database/prisma/client';
import {
    ResumenKpiDto,
    ConsultasMensualesDto,
    ActividadUsoDto,
    ServiciosPopularesDto,
    TeleconsultasVsPresencialesDto,
    PromedioEdadDto,
    RangoEdadDto,
} from '../dtos/EstadisticasAdminDtos';

const NOMBRES_MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function calcularCambioPorcentaje(actual: number, anterior: number): number {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return Math.round(((actual - anterior) / anterior) * 100 * 10) / 10;
}

function calcularEdad(fechaNacimiento: Date): number {
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
        edad--;
    }
    return edad;
}

function clasificarRangoEdad(edad: number): string {
    if (edad < 18) return '0-18';
    if (edad <= 30) return '19-30';
    if (edad <= 45) return '31-45';
    if (edad <= 60) return '46-60';
    return '60+';
}

export class EstadisticasAdminUseCase {
    /**
     * KPIs principales: total pacientes, doctores y centros de salud
     * con comparación porcentual respecto al mes anterior.
     */
    async obtenerResumen(): Promise<ResumenKpiDto> {
        const ahora = new Date();
        const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
        const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59);

        const [
            totalPacientes,
            totalDoctores,
            totalCentros,
            pacientesMesActual,
            doctoresMesActual,
            centrosMesActual,
            pacientesMesAnterior,
            doctoresMesAnterior,
            centrosMesAnterior,
        ] = await Promise.all([
            prisma.paciente.count(),
            prisma.doctor.count(),
            prisma.centroSalud.count(),
            prisma.paciente.count({ where: { creadoEn: { gte: inicioMesActual } } }),
            prisma.doctor.count({ where: { creadoEn: { gte: inicioMesActual } } }),
            prisma.centroSalud.count({ where: { creadoEn: { gte: inicioMesActual } } }),
            prisma.paciente.count({ where: { creadoEn: { gte: inicioMesAnterior, lte: finMesAnterior } } }),
            prisma.doctor.count({ where: { creadoEn: { gte: inicioMesAnterior, lte: finMesAnterior } } }),
            prisma.centroSalud.count({ where: { creadoEn: { gte: inicioMesAnterior, lte: finMesAnterior } } }),
        ]);

        return {
            pacientes: {
                total: totalPacientes,
                totalMesAnterior: pacientesMesAnterior,
                cambioPorcentaje: calcularCambioPorcentaje(pacientesMesActual, pacientesMesAnterior),
            },
            doctores: {
                total: totalDoctores,
                totalMesAnterior: doctoresMesAnterior,
                cambioPorcentaje: calcularCambioPorcentaje(doctoresMesActual, doctoresMesAnterior),
            },
            centrosSalud: {
                total: totalCentros,
                totalMesAnterior: centrosMesAnterior,
                cambioPorcentaje: calcularCambioPorcentaje(centrosMesActual, centrosMesAnterior),
            },
        };
    }

    /**
     * Citas agrupadas por mes para el año indicado.
     */
    async obtenerConsultasMensuales(anio?: number): Promise<ConsultasMensualesDto> {
        const year = anio ?? new Date().getFullYear();
        const inicio = new Date(year, 0, 1);
        const fin = new Date(year, 11, 31, 23, 59, 59);

        const citas = await prisma.cita.findMany({
            where: { fechaInicio: { gte: inicio, lte: fin } },
            select: { fechaInicio: true },
        });

        // Agrupar por mes
        const conteoMeses: number[] = new Array(12).fill(0);
        for (const cita of citas) {
            const mes = cita.fechaInicio.getMonth(); // 0-indexed
            conteoMeses[mes]++;
        }

        return {
            anio: year,
            datos: conteoMeses.map((total, idx) => ({
                mes: idx + 1,
                nombreMes: NOMBRES_MESES[idx],
                total,
            })),
        };
    }

    /**
     * Usuarios únicos que tuvieron actividad (citas) por mes.
     */
    async obtenerActividadUso(anio?: number): Promise<ActividadUsoDto> {
        const year = anio ?? new Date().getFullYear();
        const inicio = new Date(year, 0, 1);
        const fin = new Date(year, 11, 31, 23, 59, 59);

        const citas = await prisma.cita.findMany({
            where: { fechaInicio: { gte: inicio, lte: fin } },
            select: { fechaInicio: true, pacienteId: true, doctorUsuarioId: true },
        });

        // Agrupar usuarios únicos (pacientes + doctores) por mes
        const actividadMes: Map<number, Set<number>>[] = Array.from({ length: 12 }, () => new Map());
        const mesesSets: Set<number>[] = new Array(12).fill(null).map(() => new Set<number>());

        for (const cita of citas) {
            const mes = cita.fechaInicio.getMonth();
            mesesSets[mes].add(cita.pacienteId);
            if (cita.doctorUsuarioId) {
                mesesSets[mes].add(cita.doctorUsuarioId + 1_000_000); // offset para distinguir doctor de paciente
            }
        }

        return {
            anio: year,
            datos: mesesSets.map((set, idx) => ({
                mes: idx + 1,
                nombreMes: NOMBRES_MESES[idx],
                usuariosActivos: set.size,
            })),
        };
    }

    /**
     * Servicios más utilizados en citas, ordenados por frecuencia.
     */
    async obtenerServiciosPopulares(limite = 5, anio?: number): Promise<ServiciosPopularesDto> {
        const where: any = {};
        if (anio) {
            where.fechaInicio = {
                gte: new Date(anio, 0, 1),
                lte: new Date(anio, 11, 31, 23, 59, 59),
            };
        }

        const grupos = await prisma.cita.groupBy({
            by: ['servicioId'],
            where,
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
     * Comparativa de citas presenciales vs teleconsultas.
     */
    async obtenerTeleconsultasVsPresenciales(anio?: number): Promise<TeleconsultasVsPresencialesDto> {
        const where: any = {};
        if (anio) {
            where.fechaInicio = {
                gte: new Date(anio, 0, 1),
                lte: new Date(anio, 11, 31, 23, 59, 59),
            };
        }

        const grupos = await prisma.cita.groupBy({
            by: ['modalidad'],
            where,
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
     * Distribución de edades de pacientes y doctores por rangos.
     */
    async obtenerPromedioEdad(): Promise<PromedioEdadDto> {
        const [pacientes, doctores] = await Promise.all([
            prisma.paciente.findMany({ select: { fechaNacimiento: true } }),
            prisma.doctor.findMany({ select: { fechaNacimiento: true } }),
        ]);

        const rangos = ['0-18', '19-30', '31-45', '46-60', '60+'];
        const distribucionMap = new Map<string, RangoEdadDto>(
            rangos.map((r) => [r, { rango: r, pacientes: 0, doctores: 0 }])
        );

        let sumaPacientes = 0;
        let sumaDoctores = 0;

        for (const p of pacientes) {
            const edad = calcularEdad(p.fechaNacimiento);
            sumaPacientes += edad;
            const rango = clasificarRangoEdad(edad);
            distribucionMap.get(rango)!.pacientes++;
        }

        for (const d of doctores) {
            const edad = calcularEdad(d.fechaNacimiento);
            sumaDoctores += edad;
            const rango = clasificarRangoEdad(edad);
            distribucionMap.get(rango)!.doctores++;
        }

        return {
            promedioEdadPacientes: pacientes.length > 0
                ? Math.round((sumaPacientes / pacientes.length) * 10) / 10
                : 0,
            promedioEdadDoctores: doctores.length > 0
                ? Math.round((sumaDoctores / doctores.length) * 10) / 10
                : 0,
            distribucion: rangos.map((r) => distribucionMap.get(r)!),
        };
    }
}
