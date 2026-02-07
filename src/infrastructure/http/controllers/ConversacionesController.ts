import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { GestionarConversacionesUseCase } from '../../../application/use-cases/GestionarConversacionesUseCase';
import {
  CrearConversacionDto,
  ActualizarConversacionDto,
  FiltroConversacionesDto
} from '../../../application/dtos/ConversacionDtos';
import { ChatWebSocketService } from '../../external-services/ChatWebSocketService';

export class ConversacionesController {
  /**
   * Obtiene todas las conversaciones de un usuario
   * GET /api/conversaciones
   */
  async obtenerConversaciones(req: Request, res: Response): Promise<Response> {
    try {
      // En producción, el usuarioId vendría del token JWT del middleware de autenticación
      const usuarioId = (req as any).usuarioId || parseInt(req.query.usuarioId as string);

      if (!usuarioId) {
        return res.status(400).json({ 
          success: false,
          error: 'usuarioId es requerido' 
        });
      }

      const filtros: FiltroConversacionesDto = {
        usuarioId,
        estado: req.query.estado as any,
        silenciado: req.query.silenciado === 'true' ? true : req.query.silenciado === 'false' ? false : undefined,
        busqueda: req.query.busqueda as string,
        limite: parseInt(req.query.limite as string) || 50,
        offset: parseInt(req.query.offset as string) || 0
      };

      const useCase = container.resolve(GestionarConversacionesUseCase);
      const resultado = await useCase.obtenerPorUsuario(filtros);

      return res.status(200).json({
        success: true,
        mensaje: 'Conversaciones obtenidas exitosamente',
        data: resultado
      });
    } catch (error: any) {
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
  async obtenerConversacion(req: Request, res: Response): Promise<Response> {
    try {
      const conversacionId = parseInt(req.params.id as string);
      const usuarioId = (req as any).usuarioId;

      if (!usuarioId) {
        return res.status(401).json({
          success: false, 
          error: 'No autorizado' 
        });
      }

      const useCase = container.resolve(GestionarConversacionesUseCase);
      const conversacion = await useCase.obtenerPorId(conversacionId, usuarioId);

      return res.status(200).json({
        success: true,
        mensaje: 'Conversación obtenida exitosamente',
        data: conversacion
      });
    } catch (error: any) {
      console.error('Error al obtener conversación:', error);
      
      if (error.name === 'ConversacionNoEncontradaError' || error.name === 'AccesoConversacionDenegadoError') {
        return res.status(404).json({ 
          success: false,
          error: error.message });
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
  async crearConversacion(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = (req as any).usuarioId;
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

      const dto: CrearConversacionDto = {
        emisorId: usuarioId,
        receptorId: parseInt(receptorId as string)
      };

      const useCase = container.resolve(GestionarConversacionesUseCase);
      const conversacion = await useCase.crear(dto);

      // Notificar al receptor via WebSocket
      const wsService = container.resolve(ChatWebSocketService);
      wsService.notificarNuevaConversacion(receptorId, conversacion, {
        emisor: {
          id: usuarioId
          // Aquí podrías incluir más datos del emisor si los tienes disponibles
        }
      });

      return res.status(201).json({
        success: true,
        mensaje: 'Conversación creada exitosamente',
        data: conversacion.toJSON()
      });
    } catch (error: any) {
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
  async actualizarConversacion(req: Request, res: Response): Promise<Response> {
    try {
      const conversacionId = parseInt(req.params.id as string);
      const usuarioId = (req as any).usuarioId;

      if (!usuarioId) {
        return res.status(401).json({ 
          success: false,
          error: 'No autorizado' 
        });
      }

      const dto: ActualizarConversacionDto = {
        silenciado: req.body.silenciado,
        estado: req.body.estado
      };

      const useCase = container.resolve(GestionarConversacionesUseCase);
      const conversacion = await useCase.actualizar(conversacionId, usuarioId, dto);

      // Notificar via WebSocket
      const wsService = container.resolve(ChatWebSocketService);
      wsService.notificarConversacionActualizada(conversacion, usuarioId);

      return res.status(200).json({
        success: true,
        mensaje: 'Conversación actualizada exitosamente',
        data: conversacion.toJSON()
      });
    } catch (error: any) {
      console.error('Error al actualizar conversación:', error);
      
      if (error.name === 'ConversacionNoEncontradaError' || error.name === 'AccesoConversacionDenegadoError') {
        return res.status(404).json({ 
          success: false,
          error: error.message });
      }
      
      return res.status(500).json({ 
        success: false,
        error: error.message || 'Error interno del servidor' });
    }
  }

  /**
   * Elimina una conversación
   * DELETE /api/conversaciones/:id
   */
  async eliminarConversacion(req: Request, res: Response): Promise<Response> {
    try {
      const conversacionId = parseInt(req.params.id as string);
      const usuarioId = (req as any).usuarioId;

      if (!usuarioId) {
        return res.status(401).json({ 
          success: false,
          error: 'No autorizado' 
        });
      }

      const useCase = container.resolve(GestionarConversacionesUseCase);
      await useCase.eliminar(conversacionId, usuarioId);

      return res.status(200).json({
        success: true,
        mensaje: 'Conversación eliminada exitosamente'
      });
    } catch (error: any) {
      console.error('Error al eliminar conversación:', error);
      
      if (error.name === 'ConversacionNoEncontradaError' || error.name === 'AccesoConversacionDenegadoError') {
        return res.status(404).json({ 
          success: false,
          error: error.message 
        });
      }
      
      return res.status(500).json({ 
        success: false,
        error: error.message || 'Error interno del servidor' });
    }
  }

  /**
   * Obtiene o crea una conversación con otro usuario
   * POST /api/conversaciones/obtener-o-crear
   */
  async obtenerOCrearConversacion(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = (req as any).usuarioId;
      const { receptorId } = req.body;

      if (!usuarioId) {
        return res.status(401).json({ 
          success: false,
          error: 'No autorizado' });
      }

      if (!receptorId) {
        return res.status(400).json({ 
          success: false,
          error: 'receptorId es requerido' });
      }

      const useCase = container.resolve(GestionarConversacionesUseCase);
      const conversacion = await useCase.obtenerOCrear(usuarioId, parseInt(receptorId));

      return res.status(200).json({
        success: true,
        mensaje: 'Conversación obtenida exitosamente',
        data: conversacion.toJSON()
      });
    } catch (error: any) {
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
        error: error.message || 'Error interno del servidor' });
    }
  }
}
