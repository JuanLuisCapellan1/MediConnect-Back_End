"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
// Guardar en memoria RAM temporalmente
const storage = multer_1.default.memoryStorage();
// Filtro de archivos (Seguridad básica)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Tipo de archivo no soportado. Solo JPG, PNG, WEBP y PDF.'), false);
    }
};
exports.uploadMiddleware = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Límite de 5MB por archivo
    },
    fileFilter: fileFilter
});
