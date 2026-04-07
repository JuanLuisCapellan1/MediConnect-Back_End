/**
 * MediaRoutes.ts
 * Rutas HTTP para gestión de archivos multimedia (imágenes, audios, videos, documentos)
 * Usados principalmente en la integración del chat.
 *
 * Acceso: cualquier usuario autenticado
 */

import { Router } from 'express';
import multer from 'multer';
import { container } from 'tsyringe';
import { MediaController } from '../controllers/MediaController';
import { autenticarJWT } from '../middlewares/autenticacion';
import { ALL_ALLOWED_MIME_TYPES } from '../../../application/use-cases/GestionarMediaUseCase';

const router = Router();
const mediaController = container.resolve(MediaController);

// Multer en memoria — máx 50 MB, solo tipos permitidos
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (ALL_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Tipos aceptados: imagen, audio, video, pdf, word, excel, txt, zip`));
        }
    },
});

// Todas las rutas requieren autenticación
router.use(autenticarJWT);

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

export default router;
