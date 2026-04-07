import { Router } from 'express';
import { container } from 'tsyringe';
import { ResenaController } from '../controllers/ResenaController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

const ctrl = () => container.resolve(ResenaController);

// POST /resenas — Paciente crea una reseña
router.post('/', autenticarJWT, requireRole('Paciente'), (req, res) => ctrl().crear(req, res));

// GET /resenas/mis-resenas — Reseñas del paciente autenticado (antes de /:id)
router.get('/mis-resenas', autenticarJWT, requireRole('Paciente'), (req, res) => ctrl().misResenas(req, res));

// GET /resenas/servicio/:servicioId — Público
router.get('/servicio/:servicioId', (req, res) => ctrl().listarPorServicio(req, res));

// GET /resenas/doctor/:doctorId — Público
router.get('/doctor/:doctorId', (req, res) => ctrl().listarPorDoctor(req, res));

// DELETE /resenas/:id — Paciente elimina su reseña
router.delete('/:id', autenticarJWT, requireRole('Paciente'), (req, res) => ctrl().eliminar(req, res));

export default router;
