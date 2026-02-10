"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const ExperienciaLaboralController_1 = require("../controllers/ExperienciaLaboralController");
const router = (0, express_1.Router)();
const experienciaLaboralController = tsyringe_1.container.resolve(ExperienciaLaboralController_1.ExperienciaLaboralController);
// Crear una nueva experiencia laboral
router.post('/', experienciaLaboralController.crear);
// Obtener todas las experiencias laborales (con filtros)
router.get('/', experienciaLaboralController.obtenerTodos);
// Obtener experiencias laborales de un doctor específico
router.get('/doctor/:doctorId', experienciaLaboralController.obtenerPorDoctor);
// Obtener una experiencia laboral por ID
router.get('/:id', experienciaLaboralController.obtenerPorId);
// Actualizar una experiencia laboral
router.put('/:id', experienciaLaboralController.actualizar);
// Eliminar una experiencia laboral (soft delete)
router.delete('/:id', experienciaLaboralController.eliminar);
exports.default = router;
