import { Router } from 'express';
import { container } from 'tsyringe';
import { autenticarJWT } from '../middlewares/autenticacion';
import { NotificacionesController } from '../controllers/NotificacionesController';

const router = Router();

// Resuelve el controlador desde el container en cada petición (singleton seguro)
const ctrl = () => container.resolve(NotificacionesController);

/**
 * GET /notificaciones
 * Lista las notificaciones del usuario autenticado, ordenadas por creadoEn DESC.
 * Query: ?leidas=false  ?tipoAlerta=Informacion  ?tipoEntidad=Cita  ?limite=50  ?offset=0
 */
router.get('/', autenticarJWT,
  (req, res) => ctrl().obtenerNotificaciones(req, res)
);

/**
 * GET /notificaciones/no-leidas/contar
 * Retorna el número de notificaciones no leídas (para el badge de la campana).
 */
router.get('/no-leidas/contar', autenticarJWT,
  (req, res) => ctrl().contarNoLeidas(req, res)
);

/**
 * PATCH /notificaciones/leer-todas
 * Marca todas las notificaciones del usuario como leídas.
 */
router.patch('/leer-todas', autenticarJWT,
  (req, res) => ctrl().marcarTodasComoLeidas(req, res)
);

/**
 * PATCH /notificaciones/leer-varias
 * Body: { notificacionesIds: number[] }
 */
router.patch('/leer-varias', autenticarJWT,
  (req, res) => ctrl().marcarVariasComoLeidas(req, res)
);

/**
 * PATCH /notificaciones/:id/leer
 * Marca una notificación específica como leída y emite el contador actualizado por WS.
 */
router.patch('/:id/leer', autenticarJWT,
  (req, res) => ctrl().marcarComoLeida(req, res)
);

/**
 * DELETE /notificaciones/:id
 * Soft-delete: cambia estado a 'Inactivo'.
 */
router.delete('/:id', autenticarJWT,
  (req, res) => ctrl().eliminarNotificacion(req, res)
);

export default router;
