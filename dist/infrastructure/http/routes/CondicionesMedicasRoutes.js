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
// Listar alergias disponibles en el catálogo
condicionesMedicasRouter.get('/alergias/disponibles', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => controller.listarAlergiasDisponibles(req, res));
// Buscar alergias por nombre
condicionesMedicasRouter.get('/alergias/buscar', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Paciente'), (req, res) => controller.buscarAlergias(req, res));
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
// RUTAS PARA GESTIÓN DE CONDICIONES DE PACIENTES (SOLO DOCTORES)
// ==========================================
condicionesMedicasRouter.post('/:condicionId/pacientes/:pacienteId', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => controller.asignarAPaciente(req, res));
condicionesMedicasRouter.get('/pacientes/:pacienteId', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => controller.obtenerCondicionesPaciente(req, res));
condicionesMedicasRouter.patch('/pacientes/:pacienteId/condiciones/:condicionId', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => controller.actualizarCondicionPaciente(req, res));
condicionesMedicasRouter.delete('/pacientes/:pacienteId/condiciones/:condicionId', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor'), (req, res) => controller.removerCondicionPaciente(req, res));
// ==========================================
// RUTAS DEL CATÁLOGO DE CONDICIONES MÉDICAS
// ==========================================
// IMPORTANTE: Estas rutas con /:id van AL FINAL para no capturar rutas específicas
// Listar condiciones: acceso público o con autenticación básica
condicionesMedicasRouter.get('/', (req, res) => controller.listar(req, res));
// Crear: solo doctores y administradores
condicionesMedicasRouter.post('/', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor', 'Administrador'), (req, res) => controller.crear(req, res));
// Obtener por ID: acceso público o con autenticación básica
condicionesMedicasRouter.get('/:id', (req, res) => controller.obtener(req, res));
// Actualizar: solo doctores y administradores
condicionesMedicasRouter.patch('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor', 'Administrador'), (req, res) => controller.actualizar(req, res));
// Eliminar del catálogo: solo doctores y administradores
condicionesMedicasRouter.delete('/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('Doctor', 'Administrador'), (req, res) => controller.eliminar(req, res));
exports.default = condicionesMedicasRouter;
