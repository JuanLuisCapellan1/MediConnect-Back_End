"use strict";
/**
 * MediaRoutes.ts
 * Rutas HTTP para gestión de archivos multimedia (imágenes, audios, videos, documentos)
 * Usados principalmente en la integración del chat.
 *
 * Acceso: cualquier usuario autenticado
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const tsyringe_1 = require("tsyringe");
const MediaController_1 = require("../controllers/MediaController");
const autenticacion_1 = require("../middlewares/autenticacion");
const GestionarMediaUseCase_1 = require("../../../application/use-cases/GestionarMediaUseCase");
const router = (0, express_1.Router)();
const mediaController = tsyringe_1.container.resolve(MediaController_1.MediaController);
// Multer en memoria — máx 50 MB, solo tipos permitidos
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (GestionarMediaUseCase_1.ALL_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Tipos aceptados: imagen, audio, video, pdf, word, excel, txt, zip`));
        }
    },
});
// Todas las rutas requieren autenticación
router.use(autenticacion_1.autenticarJWT);
/**
 * @route GET /media/tipos-permitidos
 * @description Devuelve los tipos MIME aceptados agrupados por categoría
 * @access Autenticado
 * IMPORTANTE: debe ir antes de /:id
 */
router.get('/tipos-permitidos', (req, res) => mediaController.tiposPermitidos(req, res));
/**
 * @route GET /media
 * @description Lista los archivos registrados con filtros opcionales (tipo, limite, offset)
 * @access Autenticado
 */
router.get('/', (req, res) => mediaController.listar(req, res));
/**
 * @route POST /media
 * @description Sube un archivo al storage y lo registra en la base de datos
 * @access Autenticado
 */
router.post('/', upload.single('archivo'), (req, res) => mediaController.subir(req, res));
/**
 * @route GET /media/:id
 * @description Obtiene el detalle de un archivo por ID
 * @access Autenticado
 */
router.get('/:id', (req, res) => mediaController.obtener(req, res));
/**
 * @route PATCH /media/:id
 * @description Actualiza el nombre de un archivo
 * @access Autenticado
 */
router.patch('/:id', (req, res) => mediaController.actualizar(req, res));
/**
 * @route DELETE /media/:id
 * @description Elimina un archivo (soft delete en DB + eliminación del storage)
 * @access Autenticado
 */
router.delete('/:id', (req, res) => mediaController.eliminar(req, res));
exports.default = router;
