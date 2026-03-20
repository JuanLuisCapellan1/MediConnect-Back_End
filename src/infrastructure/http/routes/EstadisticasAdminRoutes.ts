import { Router } from 'express';
import { EstadisticasAdminController } from '../controllers/EstadisticasAdminController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';

const estadisticasAdminRouter = Router();
const controller = new EstadisticasAdminController();

// Todas las rutas requieren autenticación y rol Administrador
estadisticasAdminRouter.use(autenticarJWT, requireRole('Administrador'));

// ============================================================
// GET /api/admin/estadisticas/resumen
// KPIs: total pacientes, doctores, centros de salud + % cambio vs mes anterior
// ============================================================
estadisticasAdminRouter.get(
    '/resumen',
    (req, res) => controller.resumen(req, res)
);

// ============================================================
// GET /api/admin/estadisticas/consultas-mensuales?anio=2025
// Citas agrupadas por mes (gráfico de barras)
// ============================================================
estadisticasAdminRouter.get(
    '/consultas-mensuales',
    (req, res) => controller.consultasMensuales(req, res)
);

// ============================================================
// GET /api/admin/estadisticas/actividad-uso?anio=2025
// Usuarios únicos activos por mes (gráfico de área)
// ============================================================
estadisticasAdminRouter.get(
    '/actividad-uso',
    (req, res) => controller.actividadUso(req, res)
);

// ============================================================
// GET /api/admin/estadisticas/servicios-populares?limite=5&anio=2025
// Servicios más utilizados en citas (gráfico de torta)
// ============================================================
estadisticasAdminRouter.get(
    '/servicios-populares',
    (req, res) => controller.serviciosPopulares(req, res)
);

// ============================================================
// GET /api/admin/estadisticas/teleconsultas-vs-presenciales?anio=2025
// Comparativa de modalidades (gráfico de torta)
// ============================================================
estadisticasAdminRouter.get(
    '/teleconsultas-vs-presenciales',
    (req, res) => controller.teleconsultasVsPresenciales(req, res)
);

// ============================================================
// GET /api/admin/estadisticas/promedio-edad
// Distribución de edades de pacientes y doctores por rangos
// ============================================================
estadisticasAdminRouter.get(
    '/promedio-edad',
    (req, res) => controller.promedioEdad(req, res)
);

export default estadisticasAdminRouter;
