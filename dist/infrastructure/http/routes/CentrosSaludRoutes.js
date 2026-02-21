"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const multer_1 = __importDefault(require("multer"));
const CentrosSaludController_1 = require("../controllers/CentrosSaludController");
const autenticacion_1 = require("../middlewares/autenticacion");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const centrosSaludRouter = (0, express_1.Router)();
const controller = tsyringe_1.container.resolve(CentrosSaludController_1.CentrosSaludController);
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
const uploadFoto = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
// ─── Registro (token opcional) ─────────────────────────────────────────────────
centrosSaludRouter.post('/completar-perfil', autenticacion_1.autenticarJWTOpcional, upload.fields([{ name: 'certificadoSanitario', maxCount: 1 }, { name: 'fotoPerfil', maxCount: 1 }]), (req, res) => controller.completarPerfil(req, res));
// ─── Perfil ────────────────────────────────────────────────────────────────────
centrosSaludRouter.get('/mi-perfil', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('CentroSalud'), (req, res) => controller.obtenerPerfil(req, res));
centrosSaludRouter.put('/mi-perfil', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('CentroSalud'), (req, res) => controller.actualizarPerfil(req, res));
centrosSaludRouter.put('/mi-perfil/foto', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('CentroSalud'), uploadFoto.fields([{ name: 'fotoPerfil', maxCount: 1 }]), (req, res) => controller.actualizarFoto(req, res));
// ─── Ubicación ─────────────────────────────────────────────────────────────────
centrosSaludRouter.get('/mi-ubicacion', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('CentroSalud'), (req, res) => controller.obtenerUbicacion(req, res));
centrosSaludRouter.put('/mi-ubicacion', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('CentroSalud'), (req, res) => controller.actualizarUbicacion(req, res));
// ─── Doctores asociados ────────────────────────────────────────────────────────
centrosSaludRouter.get('/mis-doctores', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('CentroSalud'), (req, res) => controller.listarDoctores(req, res));
// ─── Solicitudes de alianza (lado Centro) ─────────────────────────────────────
centrosSaludRouter.post('/solicitudes-alianza', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('CentroSalud'), (req, res) => controller.enviarSolicitud(req, res));
centrosSaludRouter.get('/solicitudes-alianza', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('CentroSalud'), (req, res) => controller.listarSolicitudes(req, res));
centrosSaludRouter.put('/solicitudes-alianza/:id', autenticacion_1.autenticarJWT, (0, roleMiddleware_1.requireRole)('CentroSalud'), (req, res) => controller.responderSolicitud(req, res));
exports.default = centrosSaludRouter;
