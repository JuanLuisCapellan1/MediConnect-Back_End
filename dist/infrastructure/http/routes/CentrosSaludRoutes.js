"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const multer_1 = __importDefault(require("multer"));
const CentrosSaludController_1 = require("../controllers/CentrosSaludController");
const autenticacion_1 = require("../middlewares/autenticacion"); // Middleware de autenticación
const centrosSaludRouter = (0, express_1.Router)();
const controller = tsyringe_1.container.resolve(CentrosSaludController_1.CentrosSaludController);
// Configurar multer
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
});
/**
 * POST /centros-salud/completar-perfil
 * Requiere autenticación
 */
centrosSaludRouter.post('/completar-perfil', autenticacion_1.autenticarJWT, // Middleware de JWT
upload.fields([
    { name: 'certificadoSanitario', maxCount: 1 },
    { name: 'fotoPerfil', maxCount: 1 },
]), (req, res) => controller.completarPerfil(req, res));
exports.default = centrosSaludRouter;
