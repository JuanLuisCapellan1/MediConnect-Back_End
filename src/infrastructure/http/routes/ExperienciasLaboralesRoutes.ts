import { Router } from 'express';
import { container } from 'tsyringe';
import { ExperienciaLaboralController } from '../controllers/ExperienciaLaboralController';

const router = Router();
const experienciaLaboralController = container.resolve(ExperienciaLaboralController);

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

export default router;
