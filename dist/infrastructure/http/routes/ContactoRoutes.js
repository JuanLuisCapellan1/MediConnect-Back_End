"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ContactoController_1 = require("../controllers/ContactoController");
const router = (0, express_1.Router)();
const ctrl = new ContactoController_1.ContactoController();
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
exports.default = router;
