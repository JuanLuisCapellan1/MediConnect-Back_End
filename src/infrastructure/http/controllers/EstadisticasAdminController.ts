import { Request, Response } from 'express';
import { EstadisticasAdminUseCase } from '../../../application/use-cases/EstadisticasAdminUseCase';
import { PeriodoEstadistica } from '../../../application/dtos/EstadisticasAdminDtos';

const useCase = new EstadisticasAdminUseCase();

const PERIODOS_VALIDOS: PeriodoEstadistica[] = ['semana', 'mes', '3meses', 'año', 'todo'];

function parsePeriodo(raw: unknown, defecto: PeriodoEstadistica = 'año'): PeriodoEstadistica {
    const val = typeof raw === 'string' ? raw.toLowerCase() : '';
    return (PERIODOS_VALIDOS.includes(val as PeriodoEstadistica) ? val : defecto) as PeriodoEstadistica;
}

export class EstadisticasAdminController {
    /**
     * GET /api/admin/estadisticas/resumen?periodo=mes
     * KPIs: total pacientes, doctores, centros de salud + % cambio vs periodo anterior.
     * Periodos: semana | mes | 3meses | año | todo
     */
    async resumen(req: Request, res: Response): Promise<void> {
        try {
            const periodo = parsePeriodo(req.query.periodo, 'mes');
            const datos = await useCase.obtenerResumen(periodo);
            res.status(200).json({ success: true, data: datos });
        } catch (error: any) {
            console.error('[EstadisticasAdmin] resumen:', error);
            res.status(500).json({ success: false, message: 'Error al obtener el resumen de estadísticas.' });
        }
    }

    /**
     * GET /api/admin/estadisticas/consultas?periodo=año
     * Citas agrupadas con granularidad adaptativa (barras).
     * Periodos: semana | mes | 3meses | año | todo
     */
    async consultas(req: Request, res: Response): Promise<void> {
        try {
            const periodo = parsePeriodo(req.query.periodo, 'año');
            const datos = await useCase.obtenerConsultas(periodo);
            res.status(200).json({ success: true, data: datos });
        } catch (error: any) {
            console.error('[EstadisticasAdmin] consultas:', error);
            res.status(500).json({ success: false, message: 'Error al obtener las consultas.' });
        }
    }

    /**
     * GET /api/admin/estadisticas/usuarios?periodo=año
     * Usuarios registrados agrupados con granularidad adaptativa (línea).
     * Periodos: semana | mes | 3meses | año | todo
     */
    async usuarios(req: Request, res: Response): Promise<void> {
        try {
            const periodo = parsePeriodo(req.query.periodo, 'año');
            const datos = await useCase.obtenerUsuarios(periodo);
            res.status(200).json({ success: true, data: datos });
        } catch (error: any) {
            console.error('[EstadisticasAdmin] usuarios:', error);
            res.status(500).json({ success: false, message: 'Error al obtener los usuarios.' });
        }
    }

    /**
     * GET /api/admin/estadisticas/servicios?periodo=año&limite=8
     * Distribución de servicios en citas (torta).
     */
    async servicios(req: Request, res: Response): Promise<void> {
        try {
            const periodo = parsePeriodo(req.query.periodo, 'año');
            const limite = req.query.limite ? Number(req.query.limite) : 8;
            const datos = await useCase.obtenerServiciosDistribucion(periodo, limite);
            res.status(200).json({ success: true, data: datos });
        } catch (error: any) {
            console.error('[EstadisticasAdmin] servicios:', error);
            res.status(500).json({ success: false, message: 'Error al obtener la distribución de servicios.' });
        }
    }

    /**
     * GET /api/admin/estadisticas/tipo-consulta?periodo=año
     * Presencial vs Teleconsulta (torta).
     */
    async tipoConsulta(req: Request, res: Response): Promise<void> {
        try {
            const periodo = parsePeriodo(req.query.periodo, 'año');
            const datos = await useCase.obtenerTipoConsulta(periodo);
            res.status(200).json({ success: true, data: datos });
        } catch (error: any) {
            console.error('[EstadisticasAdmin] tipoConsulta:', error);
            res.status(500).json({ success: false, message: 'Error al obtener el tipo de consulta.' });
        }
    }

    /**
     * GET /api/admin/estadisticas/top-especialidades?limite=5
     * Top especialidades por calificación promedio de reseñas.
     */
    async topEspecialidades(req: Request, res: Response): Promise<void> {
        try {
            const limite = req.query.limite ? Number(req.query.limite) : 5;
            const datos = await useCase.obtenerTopEspecialidades(limite);
            res.status(200).json({ success: true, data: datos });
        } catch (error: any) {
            console.error('[EstadisticasAdmin] topEspecialidades:', error);
            res.status(500).json({ success: false, message: 'Error al obtener el top de especialidades.' });
        }
    }
}
