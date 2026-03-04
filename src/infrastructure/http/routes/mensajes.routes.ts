import { Router } from 'express';
import { MensajesController } from '../controllers/MensajesController';
import { autenticarJWT } from '../middlewares/autenticacion';

const controller = new MensajesController();

// ─── Router montado en /conversaciones ───────────────────────────────────────
const conversacionesRouter = Router();
conversacionesRouter.use(autenticarJWT);

/**
 * GET /api/conversaciones/:conversacionId/mensajes
 * Obtiene los mensajes de una conversación
 */
conversacionesRouter.get('/:conversacionId/mensajes', (req, res) => controller.obtenerMensajes(req, res));

/**
 * POST /api/conversaciones/:conversacionId/mensajes
 * Crea un nuevo mensaje en una conversación
 */
conversacionesRouter.post('/:conversacionId/mensajes', (req, res) => controller.crearMensaje(req, res));

/**
 * POST /api/conversaciones/:conversacionId/marcar-leidos
 * Marca mensajes como leídos
 */
conversacionesRouter.post('/:conversacionId/marcar-leidos', (req, res) => controller.marcarMensajesLeidos(req, res));

/**
 * GET /api/conversaciones/:conversacionId/no-leidos
 * Cuenta mensajes no leídos en una conversación
 */
conversacionesRouter.get('/:conversacionId/no-leidos', (req, res) => controller.contarNoLeidos(req, res));

/**
 * GET /api/conversaciones/:conversacionId/buscar
 * Busca mensajes en una conversación
 */
conversacionesRouter.get('/:conversacionId/buscar', (req, res) => controller.buscarMensajes(req, res));

// ─── Router montado en /mensajes (operaciones sobre mensajes individuales) ───
const mensajesRouter = Router();
mensajesRouter.use(autenticarJWT);

/**
 * PATCH /api/mensajes/:id
 * Edita el contenido de un mensaje (solo el remitente)
 */
mensajesRouter.patch('/:id', (req, res) => controller.actualizarMensaje(req, res));

/**
 * DELETE /api/mensajes/:id
 * Elimina un mensaje (soft delete, solo el remitente)
 */
mensajesRouter.delete('/:id', (req, res) => controller.eliminarMensaje(req, res));

export { conversacionesRouter, mensajesRouter };
export default conversacionesRouter;
