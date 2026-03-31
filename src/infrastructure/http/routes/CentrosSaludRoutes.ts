import { Router } from 'express';
import { container } from 'tsyringe';
import multer from 'multer';
import { CentrosSaludController } from '../controllers/CentrosSaludController';
import { autenticarJWT, autenticarJWTOpcional } from '../middlewares/autenticacion';
import { requireRole } from '../middlewares/roleMiddleware';
import { translationMiddleware } from '../middlewares/TranslationMiddleware';

const centrosSaludRouter = Router();
const controller = container.resolve(CentrosSaludController);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const uploadFoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ─── Registro (token opcional) ─────────────────────────────────────────────────
centrosSaludRouter.post(
  '/completar-perfil',
  autenticarJWTOpcional,
  upload.fields([{ name: 'certificadoSanitario', maxCount: 1 }, { name: 'fotoPerfil', maxCount: 1 }]),
  (req, res) => controller.completarPerfil(req, res)
);

// ─── Perfil ────────────────────────────────────────────────────────────────────
centrosSaludRouter.get(
  '/mi-perfil',
  autenticarJWT,
  requireRole('Centro'),
  translationMiddleware,
  (req, res) => controller.obtenerPerfil(req, res)
);

centrosSaludRouter.put(
  '/mi-perfil',
  autenticarJWT,
  requireRole('Centro'),
  translationMiddleware,
  (req, res) => controller.actualizarPerfil(req, res)
);

// ─── Documentos (Certificación Sanitaria) ──────────────────────────────────────
centrosSaludRouter.get(
  '/mis-documentos',
  autenticarJWT,
  requireRole('Centro'),
  translationMiddleware,
  (req, res) => controller.obtenerEstadoDocumentos(req, res)
);

centrosSaludRouter.put(
  '/documentos/:id',
  autenticarJWT,
  requireRole('Centro'),
  upload.single('archivo'),
  (req, res) => controller.actualizarDocumento(req, res)
);


// ─── Ubicación ─────────────────────────────────────────────────────────────────
centrosSaludRouter.get(
  '/mi-ubicacion',
  autenticarJWT,
  requireRole('Centro'),
  (req, res) => controller.obtenerUbicacion(req, res)
);

centrosSaludRouter.put(
  '/mi-ubicacion',
  autenticarJWT,
  requireRole('Centro'),
  (req, res) => controller.actualizarUbicacion(req, res)
);

// ─── Doctores asociados ────────────────────────────────────────────────────────
centrosSaludRouter.get(
  '/mis-doctores',
  autenticarJWT,
  requireRole('Centro'),
  translationMiddleware,
  (req, res) => controller.listarDoctores(req, res)
);

// ─── Solicitudes de alianza (lado Centro) ─────────────────────────────────────
centrosSaludRouter.post(
  '/solicitudes-alianza',
  autenticarJWT,
  requireRole('Centro'),
  (req, res) => controller.enviarSolicitud(req, res)
);

centrosSaludRouter.get(
  '/solicitudes-alianza',
  autenticarJWT,
  requireRole('Centro'),
  translationMiddleware,
  (req, res) => controller.listarSolicitudes(req, res)
);

centrosSaludRouter.put(
  '/solicitudes-alianza/:id',
  autenticarJWT,
  requireRole('Centro'),
  (req, res) => controller.responderSolicitud(req, res)
);

// ─── Vista completa para Administrador ────────────────────────────────────────
centrosSaludRouter.get(
  '/admin',
  autenticarJWT,
  requireRole('Administrador'),
  translationMiddleware,
  (req, res) => controller.listarParaAdmin(req, res)
);

centrosSaludRouter.get(
  '/admin/:id',
  autenticarJWT,
  requireRole('Administrador'),
  translationMiddleware,
  (req, res) => controller.obtenerParaAdmin(req, res)
);

// ─── Analíticas del Centro ─────────────────────────────────────────────────────
centrosSaludRouter.get(
  '/estadisticas/general',
  autenticarJWT,
  requireRole('Centro'),
  translationMiddleware,
  (req, res) => controller.estadisticasGenerales(req, res)
);

centrosSaludRouter.get(
  '/estadisticas/crecimiento-medicos',
  autenticarJWT,
  requireRole('Centro'),
  translationMiddleware,
  (req, res) => controller.crecimientoMedicos(req, res)
);

centrosSaludRouter.get(
  '/estadisticas/distribucion-especialidades',
  autenticarJWT,
  requireRole('Centro'),
  translationMiddleware,
  (req, res) => controller.distribucionEspecialidades(req, res)
);

export default centrosSaludRouter;