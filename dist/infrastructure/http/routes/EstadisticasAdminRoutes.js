"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const EstadisticasAdminController_1 = require("../controllers/EstadisticasAdminController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const estadisticasAdminRouter = (0, express_1.Router)();
const controller = new EstadisticasAdminController_1.EstadisticasAdminController();
// Todas las rutas requieren autenticación y rol Administrador
estadisticasAdminRouter.use(autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'));
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
exports.default = estadisticasAdminRouter;
