import { Router } from 'express';
import { container } from 'tsyringe';
import multer from 'multer';
import { CentrosSaludController } from '../controllers/CentrosSaludController';
import { autenticarJWTOpcional } from '../middlewares/autenticacion'; // Middleware opcional para aceptar registro tokens

const centrosSaludRouter = Router();
const controller = container.resolve(CentrosSaludController);

// Configurar multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/**
 * POST /centros-salud/completar-perfil
 * Requiere autenticación
 */
centrosSaludRouter.post(
  '/completar-perfil',
  autenticarJWTOpcional, // Middleware opcional (no bloqueante)
  upload.fields([
    { name: 'certificadoSanitario', maxCount: 1 },
    { name: 'fotoPerfil', maxCount: 1 },
  ]),
  (req, res) => controller.completarPerfil(req, res)
);

export default centrosSaludRouter;