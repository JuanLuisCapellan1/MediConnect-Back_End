"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const router = (0, express_1.Router)();
const controller = new AuthController_1.AuthController();
/**
 * POST /api/auth/password/solicitar-codigo
 * Body: { email: string }
 */
router.post('/password/solicitar-codigo', (req, res) => controller.solicitarCodigoRecuperacion(req, res));
/**
 * POST /api/auth/password/validar-codigo
 * Body: { email: string, codigo: string }
 */
router.post('/password/validar-codigo', (req, res) => controller.validarCodigoRecuperacion(req, res));
/**
 * POST /api/auth/password/cambiar
 * Body: { token: string, nuevaPassword: string, confirmarPassword: string }
 */
router.post('/password/cambiar', (req, res) => controller.cambiarPasswordConToken(req, res));
exports.default = router;
