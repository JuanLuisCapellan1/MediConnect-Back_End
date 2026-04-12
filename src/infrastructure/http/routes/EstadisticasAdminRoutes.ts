import { Router } from 'express';
import { EstadisticasAdminController } from '../controllers/EstadisticasAdminController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';

const estadisticasAdminRouter = Router();
const controller = new EstadisticasAdminController();

// Todas las rutas requieren autenticación y rol Administrador
estadisticasAdminRouter.use(autenticarJWT, requireRole('Administrador'));

// ── KPIs superiores ──────────────────────────────────────────────────────────
// GET /api/admin/estadisticas/resumen?periodo=mes
// Periodos: semana | mes | 3meses | año | todo
estadisticasAdminRouter.get('/resumen', (req, res) => controller.resumen(req, res));

// ── Gráfico de consultas (barras) ────────────────────────────────────────────
// GET /api/admin/estadisticas/consultas?periodo=año
estadisticasAdminRouter.get('/consultas', (req, res) => controller.consultas(req, res));

// ── Gráfico de usuarios registrados (línea) ──────────────────────────────────
// GET /api/admin/estadisticas/usuarios?periodo=año
estadisticasAdminRouter.get('/usuarios', (req, res) => controller.usuarios(req, res));

// ── Gráfico de torta: distribución de servicios ──────────────────────────────
// GET /api/admin/estadisticas/servicios?periodo=año&limite=8
estadisticasAdminRouter.get('/servicios', (req, res) => controller.servicios(req, res));

// ── Gráfico de torta: presencial vs teleconsulta ─────────────────────────────
// GET /api/admin/estadisticas/tipo-consulta?periodo=año
estadisticasAdminRouter.get('/tipo-consulta', (req, res) => controller.tipoConsulta(req, res));

// ── Top especialidades por calificación ──────────────────────────────────────
// GET /api/admin/estadisticas/top-especialidades?limite=5
estadisticasAdminRouter.get('/top-especialidades', (req, res) => controller.topEspecialidades(req, res));

export default estadisticasAdminRouter;
