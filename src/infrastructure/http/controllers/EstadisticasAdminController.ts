import { Request, Response } from 'express';
import { EstadisticasAdminUseCase } from '../../../application/use-cases/EstadisticasAdminUseCase';

const useCase = new EstadisticasAdminUseCase();

export class EstadisticasAdminController {
    /**
     * GET /api/admin/estadisticas/resumen
     * KPIs: total pacientes, doctores, centros de salud + % cambio vs mes anterior
     */
    async resumen(req: Request, res: Response): Promise<void> {
        try {
            const datos = await useCase.obtenerResumen();
            res.status(200).json({ success: true, data: datos });
        } catch (error: any) {
            console.error('[EstadisticasAdmin] resumen:', error);
            res.status(500).json({ success: false, message: 'Error al obtener el resumen de estadísticas.' });
        }
    }

    /**
     * GET /api/admin/estadisticas/consultas-mensuales?anio=2025
     * Citas agrupadas mes a mes (gráfico de barras)
     */
    async consultasMensuales(req: Request, res: Response): Promise<void> {
        try {
            const anio = req.query.anio ? Number(req.query.anio) : undefined;
            const datos = await useCase.obtenerConsultasMensuales(anio);
            res.status(200).json({ success: true, data: datos });
        } catch (error: any) {
            console.error('[EstadisticasAdmin] consultasMensuales:', error);
            res.status(500).json({ success: false, message: 'Error al obtener las consultas mensuales.' });
        }
    }

    /**
     * GET /api/admin/estadisticas/actividad-uso?anio=2025
     * Usuarios únicos activos por mes (gráfico de área)
     */
    async actividadUso(req: Request, res: Response): Promise<void> {
        try {
            const anio = req.query.anio ? Number(req.query.anio) : undefined;
            const datos = await useCase.obtenerActividadUso(anio);
            res.status(200).json({ success: true, data: datos });
        } catch (error: any) {
            console.error('[EstadisticasAdmin] actividadUso:', error);
            res.status(500).json({ success: false, message: 'Error al obtener la actividad de uso.' });
        }
    }

    /**
     * GET /api/admin/estadisticas/servicios-populares?limite=5&anio=2025
     * Servicios más utilizados en citas (gráfico de torta)
     */
    async serviciosPopulares(req: Request, res: Response): Promise<void> {
        try {
            const limite = req.query.limite ? Number(req.query.limite) : 5;
            const anio = req.query.anio ? Number(req.query.anio) : undefined;
            const datos = await useCase.obtenerServiciosPopulares(limite, anio);
            res.status(200).json({ success: true, data: datos });
        } catch (error: any) {
            console.error('[EstadisticasAdmin] serviciosPopulares:', error);
            res.status(500).json({ success: false, message: 'Error al obtener los servicios populares.' });
        }
    }

    /**
     * GET /api/admin/estadisticas/teleconsultas-vs-presenciales?anio=2025
     * Comparativa de modalidades (gráfico de torta)
     */
    async teleconsultasVsPresenciales(req: Request, res: Response): Promise<void> {
        try {
            const anio = req.query.anio ? Number(req.query.anio) : undefined;
            const datos = await useCase.obtenerTeleconsultasVsPresenciales(anio);
            res.status(200).json({ success: true, data: datos });
        } catch (error: any) {
            console.error('[EstadisticasAdmin] teleconsultasVsPresenciales:', error);
            res.status(500).json({ success: false, message: 'Error al obtener la comparativa de modalidades.' });
        }
    }

    /**
     * GET /api/admin/estadisticas/promedio-edad
     * Distribución de edades por rangos (gráfico de área/línea)
     */
    async promedioEdad(req: Request, res: Response): Promise<void> {
        try {
            const datos = await useCase.obtenerPromedioEdad();
            res.status(200).json({ success: true, data: datos });
        } catch (error: any) {
            console.error('[EstadisticasAdmin] promedioEdad:', error);
            res.status(500).json({ success: false, message: 'Error al obtener el promedio de edad.' });
        }
    }
}
