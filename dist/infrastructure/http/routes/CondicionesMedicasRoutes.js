"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const CondicionMedicaController_1 = require("../controllers/CondicionMedicaController");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const autenticacion_1 = require("../middlewares/autenticacion");
const condicionesMedicasRouter = (0, express_1.Router)();
const controller = tsyringe_1.container.resolve(CondicionMedicaController_1.CondicionMedicaController);
// ==========================================
// RUTAS PARA PACIENTES (AUTO-GESTIÓN)
// ==========================================
// IMPORTANTE: Estas rutas deben ir PRIMERO para evitar conflictos con /:id
// Listar alergias disponibles en el catálogo (Paciente y Administrador)
condicionesMedicasRouter.get('/alergias/disponibles', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente', 'Administrador'), (req, res) => controller.listarAlergiasDisponibles(req, res));
// Buscar alergias por nombre (Paciente y Administrador)
condicionesMedicasRouter.get('/alergias/buscar', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente', 'Administrador'), (req, res) => controller.buscarAlergias(req, res));
// Agregar una alergia del catálogo al perfil del paciente
condicionesMedicasRouter.post('/mis-alergias', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => controller.agregarMiAlergia(req, res));
// Actualizar una alergia del paciente
condicionesMedicasRouter.patch('/mis-alergias/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => controller.actualizarMiAlergia(req, res));
// Eliminar una alergia del paciente
condicionesMedicasRouter.delete('/mis-alergias/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => controller.eliminarMiAlergia(req, res));
// Obtener todas las condiciones médicas del paciente
condicionesMedicasRouter.get('/mis-condiciones', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => controller.obtenerMisCondiciones(req, res));
// Crear una condición médica personal
condicionesMedicasRouter.post('/mis-condiciones', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => controller.crearMiCondicion(req, res));
// Actualizar una condición médica del paciente
condicionesMedicasRouter.patch('/mis-condiciones/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => controller.actualizarMiCondicion(req, res));
// Eliminar una condición médica del paciente
condicionesMedicasRouter.delete('/mis-condiciones/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => controller.eliminarMiCondicion(req, res));
// ==========================================
// ADMIN - Visualización del catálogo de Alergias
// ==========================================
// Listar TODAS las alergias del catálogo (incluyendo inactivas/eliminadas)
// Usa ?estado=Activo|Inactivo|Eliminado&nombre=x&pagina=1&limite=10
condicionesMedicasRouter.get('/admin/alergias', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => {
    // Forzar tipo=Alergia y pasar el resto de filtros
    req.query.tipo = 'Alergia';
    return controller.listar(req, res);
});
// ==========================================
// RUTAS DEL CATÁLOGO DE CONDICIONES MÉDICAS (SOLO ADMINISTRADOR)
// ==========================================
// IMPORTANTE: Estas rutas con /:id van AL FINAL para no capturar rutas específicas
// Listar condiciones: solo Administrador
condicionesMedicasRouter.get('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => controller.listar(req, res));
// Crear entrada en el catálogo: solo Administrador (únicamente Alergias)
condicionesMedicasRouter.post('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => controller.crear(req, res));
// Obtener por ID: solo Administrador
condicionesMedicasRouter.get('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => controller.obtener(req, res));
// Actualizar entrada del catálogo: solo Administrador (únicamente Alergias)
condicionesMedicasRouter.patch('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => controller.actualizar(req, res));
// Eliminar (soft delete) del catálogo: solo Administrador (únicamente Alergias)
condicionesMedicasRouter.delete('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Administrador'), (req, res) => controller.eliminar(req, res));
exports.default = condicionesMedicasRouter;
