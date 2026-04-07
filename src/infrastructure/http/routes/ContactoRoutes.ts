import { Router } from 'express';
import { ContactoController } from '../controllers/ContactoController';

const router = Router();
const ctrl = new ContactoController();

/**
 * POST /contacto/enviar
 * Formulario de contacto público — envía mensaje al equipo de MediConnect.
 * Body: { nombre, correo, asunto, mensaje }
 */
router.post('/enviar', (req, res) => ctrl.enviarContacto(req, res));

/**
 * POST /contacto/newsletter
 * Suscripción al newsletter — guarda el correo y envía bienvenida.
 * Body: { correo }
 */
router.post('/newsletter', (req, res) => ctrl.suscribirseNewsletter(req, res));

export default router;
