"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstadisticasAdminController = void 0;
const EstadisticasAdminUseCase_1 = require("../../../application/use-cases/EstadisticasAdminUseCase");
const useCase = new EstadisticasAdminUseCase_1.EstadisticasAdminUseCase();
const PERIODOS_VALIDOS = ['semana', 'mes', '3meses', 'año', 'todo'];
function parsePeriodo(raw, defecto = 'año') {
    const val = typeof raw === 'string' ? raw.toLowerCase() : '';
    return (PERIODOS_VALIDOS.includes(val) ? val : defecto);
}
class EstadisticasAdminController {
    /**
     * GET /api/admin/estadisticas/resumen?periodo=mes
     * KPIs: total pacientes, doctores, centros de salud + % cambio vs periodo anterior.
     * Periodos: semana | mes | 3meses | año | todo
     */
    async resumen(req, res) {
        try {
            const periodo = parsePeriodo(req.query.periodo, 'mes');
            const datos = await useCase.obtenerResumen(periodo);
            res.status(200).json({ success: true, data: datos });
        }
        catch (error) {
            console.error('[EstadisticasAdmin] resumen:', error);
            res.status(500).json({ success: false, message: 'Error al obtener el resumen de estadísticas.' });
        }
    }
    /**
     * GET /api/admin/estadisticas/consultas?periodo=año
     * Citas agrupadas con granularidad adaptativa (barras).
     * Periodos: semana | mes | 3meses | año | todo
     */
    async consultas(req, res) {
        try {
            const periodo = parsePeriodo(req.query.periodo, 'año');
            const datos = await useCase.obtenerConsultas(periodo);
            res.status(200).json({ success: true, data: datos });
        }
        catch (error) {
            console.error('[EstadisticasAdmin] consultas:', error);
            res.status(500).json({ success: false, message: 'Error al obtener las consultas.' });
        }
    }
    /**
     * GET /api/admin/estadisticas/usuarios?periodo=año
     * Usuarios registrados agrupados con granularidad adaptativa (línea).
     * Periodos: semana | mes | 3meses | año | todo
     */
    async usuarios(req, res) {
        try {
            const periodo = parsePeriodo(req.query.periodo, 'año');
            const datos = await useCase.obtenerUsuarios(periodo);
            res.status(200).json({ success: true, data: datos });
        }
        catch (error) {
            console.error('[EstadisticasAdmin] usuarios:', error);
            res.status(500).json({ success: false, message: 'Error al obtener los usuarios.' });
        }
    }
    /**
     * GET /api/admin/estadisticas/servicios?periodo=año&limite=8
     * Distribución de servicios en citas (torta).
     */
    async servicios(req, res) {
        try {
            const periodo = parsePeriodo(req.query.periodo, 'año');
            const limite = req.query.limite ? Number(req.query.limite) : 8;
            const datos = await useCase.obtenerServiciosDistribucion(periodo, limite);
            res.status(200).json({ success: true, data: datos });
        }
        catch (error) {
            console.error('[EstadisticasAdmin] servicios:', error);
            res.status(500).json({ success: false, message: 'Error al obtener la distribución de servicios.' });
        }
    }
    /**
     * GET /api/admin/estadisticas/tipo-consulta?periodo=año
     * Presencial vs Teleconsulta (torta).
     */
    async tipoConsulta(req, res) {
        try {
            const periodo = parsePeriodo(req.query.periodo, 'año');
            const datos = await useCase.obtenerTipoConsulta(periodo);
            res.status(200).json({ success: true, data: datos });
        }
        catch (error) {
            console.error('[EstadisticasAdmin] tipoConsulta:', error);
            res.status(500).json({ success: false, message: 'Error al obtener el tipo de consulta.' });
        }
    }
    /**
     * GET /api/admin/estadisticas/top-especialidades?limite=5
     * Top especialidades por calificación promedio de reseñas.
     */
    async topEspecialidades(req, res) {
        try {
            const limite = req.query.limite ? Number(req.query.limite) : 5;
            const datos = await useCase.obtenerTopEspecialidades(limite);
            res.status(200).json({ success: true, data: datos });
        }
        catch (error) {
            console.error('[EstadisticasAdmin] topEspecialidades:', error);
            res.status(500).json({ success: false, message: 'Error al obtener el top de especialidades.' });
        }
    }
}
exports.EstadisticasAdminController = EstadisticasAdminController;
