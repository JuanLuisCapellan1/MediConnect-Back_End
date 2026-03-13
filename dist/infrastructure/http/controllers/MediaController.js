"use strict";
/**
 * MediaController.ts
 * Controlador HTTP para gestión de archivos multimedia (chat)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaController = void 0;
const tsyringe_1 = require("tsyringe");
const GestionarMediaUseCase_1 = require("../../../application/use-cases/GestionarMediaUseCase");
class MediaController {
    get useCase() {
        return tsyringe_1.container.resolve(GestionarMediaUseCase_1.GestionarMediaUseCase);
    }
    /**
     * POST /media
     * Sube un archivo al storage y lo registra en la DB.
     */
    async subir(req, res) {
        try {
            const file = req.file;
            if (!file) {
                res.status(400).json({ success: false, message: 'No se proporcionó ningún archivo' });
                return;
            }
            const usuarioId = req.user?.userId;
            if (!usuarioId) {
                res.status(401).json({ success: false, message: 'No autenticado' });
                return;
            }
            const media = await this.useCase.subirArchivo(usuarioId, {
                buffer: file.buffer,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
            });
            res.status(201).json({
                success: true,
                message: 'Archivo subido exitosamente',
                data: media.toJSON(),
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * GET /media
     * Lista archivos con filtros opcionales.
     * Query: tipo (image|audio|video|file), limite, offset
     */
    async listar(req, res) {
        try {
            const filtros = {};
            if (req.query.tipo) {
                const tipoMap = {
                    image: 'image/',
                    audio: 'audio/',
                    video: 'video/',
                    file: 'application/',
                };
                const tipoQuery = String(req.query.tipo).toLowerCase();
                filtros.tipoMime = tipoMap[tipoQuery] ?? String(req.query.tipo);
            }
            if (req.query.limite)
                filtros.limite = Number(req.query.limite);
            if (req.query.offset)
                filtros.offset = Number(req.query.offset);
            const medias = await this.useCase.obtenerTodos(filtros);
            res.status(200).json({
                success: true,
                total: medias.length,
                data: medias.map(m => m.toJSON()),
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * GET /media/:id
     * Obtiene el detalle de un archivo.
     */
    async obtener(req, res) {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ success: false, message: 'ID inválido' });
                return;
            }
            const media = await this.useCase.obtenerPorId(id);
            res.status(200).json({
                success: true,
                data: media.toJSON(),
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * PATCH /media/:id
     * Actualiza el nombre del archivo.
     */
    async actualizar(req, res) {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ success: false, message: 'ID inválido' });
                return;
            }
            const { nombre } = req.body;
            if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
                res.status(400).json({ success: false, message: 'El campo nombre es requerido' });
                return;
            }
            const media = await this.useCase.actualizar(id, { nombre: nombre.trim() });
            res.status(200).json({
                success: true,
                message: 'Archivo actualizado exitosamente',
                data: media.toJSON(),
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * DELETE /media/:id
     * Elimina un archivo (soft delete + storage).
     */
    async eliminar(req, res) {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ success: false, message: 'ID inválido' });
                return;
            }
            await this.useCase.eliminar(id);
            res.status(200).json({
                success: true,
                message: 'Archivo eliminado exitosamente',
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * GET /media/tipos-permitidos
     * Devuelve los tipos MIME aceptados por categoría.
     */
    async tiposPermitidos(_req, res) {
        const tipos = this.useCase.obtenerTiposPermitidos();
        res.status(200).json({ success: true, data: tipos });
    }
    manejarError(error, res, status = 400) {
        const mensaje = error instanceof Error ? error.message : 'Error inesperado';
        if (mensaje.toLowerCase().includes('no encontrado') || mensaje.includes('404')) {
            res.status(404).json({ success: false, message: mensaje });
            return;
        }
        res.status(status).json({ success: false, message: mensaje });
    }
}
exports.MediaController = MediaController;
