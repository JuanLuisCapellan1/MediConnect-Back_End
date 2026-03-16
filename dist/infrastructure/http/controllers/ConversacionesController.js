"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversacionesController = void 0;
const tsyringe_1 = require("tsyringe");
const GestionarConversacionesUseCase_1 = require("../../../application/use-cases/GestionarConversacionesUseCase");
const ChatWebSocketService_1 = require("../../external-services/ChatWebSocketService");
class ConversacionesController {
    /**
     * Obtiene todas las conversaciones de un usuario
     * GET /api/conversaciones
     */
    async obtenerConversaciones(req, res) {
        try {
            // En producción, el usuarioId vendría del token JWT del middleware de autenticación
            const usuarioId = req.usuarioId || parseInt(req.query.usuarioId);
            if (!usuarioId) {
                return res.status(400).json({
                    success: false,
                    error: 'usuarioId es requerido'
                });
            }
            const filtros = {
                usuarioId,
                estado: req.query.estado,
                silenciado: req.query.silenciado === 'true' ? true : req.query.silenciado === 'false' ? false : undefined,
                busqueda: req.query.busqueda,
                limite: parseInt(req.query.limite) || 50,
                offset: parseInt(req.query.offset) || 0
            };
            const useCase = tsyringe_1.container.resolve(GestionarConversacionesUseCase_1.GestionarConversacionesUseCase);
            const resultado = await useCase.obtenerPorUsuario(filtros);
            return res.status(200).json({
                success: true,
                mensaje: 'Conversaciones obtenidas exitosamente',
                data: resultado
            });
        }
        catch (error) {
            console.error('Error al obtener conversaciones:', error);
            return res.status(500).json({
                success: false,
                error: error.message || 'Error interno del servidor'
            });
        }
    }
    /**
     * Obtiene una conversación específica por ID
     * GET /api/conversaciones/:id
     */
    async obtenerConversacion(req, res) {
        try {
            const conversacionId = parseInt(req.params.id);
            const usuarioId = req.usuarioId;
            if (!usuarioId) {
                return res.status(401).json({
                    success: false,
                    error: 'No autorizado'
                });
            }
            const useCase = tsyringe_1.container.resolve(GestionarConversacionesUseCase_1.GestionarConversacionesUseCase);
            const conversacion = await useCase.obtenerPorId(conversacionId, usuarioId);
            return res.status(200).json({
                success: true,
                mensaje: 'Conversación obtenida exitosamente',
                data: conversacion
            });
        }
        catch (error) {
            console.error('Error al obtener conversación:', error);
            if (error.name === 'ConversacionNoEncontradaError' || error.name === 'AccesoConversacionDenegadoError') {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            return res.status(500).json({
                success: false,
                error: error.message || 'Error interno del servidor'
            });
        }
    }
    /**
     * Crea una nueva conversación
     * POST /api/conversaciones
     */
    async crearConversacion(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const { receptorId } = req.body;
            if (!usuarioId) {
                return res.status(401).json({
                    success: false,
                    error: 'No autorizado'
                });
            }
            if (!receptorId) {
                return res.status(400).json({
                    success: false,
                    error: 'receptorId es requerido'
                });
            }
            const dto = {
                emisorId: usuarioId,
                receptorId: parseInt(receptorId)
            };
            const useCase = tsyringe_1.container.resolve(GestionarConversacionesUseCase_1.GestionarConversacionesUseCase);
            const conversacion = await useCase.crear(dto);
            // Notificar al receptor via WebSocket
            const wsService = tsyringe_1.container.resolve(ChatWebSocketService_1.ChatWebSocketService);
            wsService.notificarNuevaConversacion(parseInt(receptorId), conversacion, {
                emisor: {
                    id: usuarioId
                }
            });
            return res.status(201).json({
                success: true,
                mensaje: 'Conversación creada exitosamente',
                data: conversacion.toJSON()
            });
        }
        catch (error) {
            console.error('Error al crear conversación:', error);
            if (error.name === 'ConversacionYaExisteError') {
                return res.status(409).json({
                    success: false,
                    error: error.message
                });
            }
            if (error.name === 'UsuarioNoEncontradoError') {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            if (error.name === 'ConversacionMismoUsuarioError') {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            if (error.name === 'ConversacionNoPermitidaEntreRolesError') {
                return res.status(403).json({
                    success: false,
                    error: error.message
                });
            }
            return res.status(500).json({
                success: false,
                error: error.message || 'Error interno del servidor'
            });
        }
    }
    /**
     * Actualiza una conversación (silenciar, archivar, etc.)
     * PATCH /api/conversaciones/:id
     */
    async actualizarConversacion(req, res) {
        try {
            const conversacionId = parseInt(req.params.id);
            const usuarioId = req.usuarioId;
            if (!usuarioId) {
                return res.status(401).json({
                    success: false,
                    error: 'No autorizado'
                });
            }
            const dto = {
                silenciado: req.body.silenciado,
                estado: req.body.estado
            };
            const useCase = tsyringe_1.container.resolve(GestionarConversacionesUseCase_1.GestionarConversacionesUseCase);
            const conversacion = await useCase.actualizar(conversacionId, usuarioId, dto);
            // Notificar via WebSocket
            const wsService = tsyringe_1.container.resolve(ChatWebSocketService_1.ChatWebSocketService);
            wsService.notificarConversacionActualizada(conversacion, usuarioId);
            return res.status(200).json({
                success: true,
                mensaje: 'Conversación actualizada exitosamente',
                data: conversacion.toJSON()
            });
        }
        catch (error) {
            console.error('Error al actualizar conversación:', error);
            if (error.name === 'ConversacionNoEncontradaError' || error.name === 'AccesoConversacionDenegadoError') {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            return res.status(500).json({
                success: false,
                error: error.message || 'Error interno del servidor'
            });
        }
    }
    /**
     * Elimina una conversación
     * DELETE /api/conversaciones/:id
     */
    async eliminarConversacion(req, res) {
        try {
            const conversacionId = parseInt(req.params.id);
            const usuarioId = req.usuarioId;
            if (!usuarioId) {
                return res.status(401).json({
                    success: false,
                    error: 'No autorizado'
                });
            }
            const useCase = tsyringe_1.container.resolve(GestionarConversacionesUseCase_1.GestionarConversacionesUseCase);
            await useCase.eliminar(conversacionId, usuarioId);
            return res.status(200).json({
                success: true,
                mensaje: 'Conversación eliminada exitosamente'
            });
        }
        catch (error) {
            console.error('Error al eliminar conversación:', error);
            if (error.name === 'ConversacionNoEncontradaError' || error.name === 'AccesoConversacionDenegadoError') {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            return res.status(500).json({
                success: false,
                error: error.message || 'Error interno del servidor'
            });
        }
    }
    /**
     * Obtiene o crea una conversación con otro usuario
     * POST /api/conversaciones/obtener-o-crear
     */
    async obtenerOCrearConversacion(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const { receptorId } = req.body;
            if (!usuarioId) {
                return res.status(401).json({
                    success: false,
                    error: 'No autorizado'
                });
            }
            if (!receptorId) {
                return res.status(400).json({
                    success: false,
                    error: 'receptorId es requerido'
                });
            }
            const useCase = tsyringe_1.container.resolve(GestionarConversacionesUseCase_1.GestionarConversacionesUseCase);
            const conversacion = await useCase.obtenerOCrear(usuarioId, parseInt(receptorId));
            return res.status(200).json({
                success: true,
                mensaje: 'Conversación obtenida exitosamente',
                data: conversacion.toJSON()
            });
        }
        catch (error) {
            console.error('Error al obtener o crear conversación:', error);
            if (error.name === 'UsuarioNoEncontradoError') {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            if (error.name === 'ConversacionMismoUsuarioError') {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            if (error.name === 'ConversacionNoPermitidaEntreRolesError') {
                return res.status(403).json({
                    success: false,
                    error: error.message
                });
            }
            return res.status(500).json({
                success: false,
                error: error.message || 'Error interno del servidor'
            });
        }
    }
}
exports.ConversacionesController = ConversacionesController;
