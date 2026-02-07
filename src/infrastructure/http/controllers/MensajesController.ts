import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { GestionarMensajesUseCase } from '../../../application/use-cases/GestionarMensajesUseCase';
import { GestionarMediaUseCase } from '../../../application/use-cases/GestionarMediaUseCase';
import {
  CrearMensajeDto,
  ActualizarMensajeDto,
  FiltroMensajesDto,
  MarcarMensajesLeidosDto
} from '../../../application/dtos/MensajeDtos';
import { ChatWebSocketService } from '../../external-services/ChatWebSocketService';
import { IConversacionesRepository } from '../../../domain/repositories/IConversacionesRepository';
import { success } from 'zod';

export class MensajesController {
  /**
   * Obtiene los mensajes de una conversación
   * GET /api/conversaciones/:conversacionId/mensajes
   */
  async obtenerMensajes(req: Request, res: Response): Promise<Response> {
    try {
      const conversacionId = parseInt(req.params.conversacionId as string);
      const usuarioId = (req as any).usuarioId;

      if (!usuarioId) {
        return res.status(401).json({ 
          success: false,
          error: 'No autorizado' });
      }

      const filtros: FiltroMensajesDto = {
        conversacionId,
        usuarioId,
        tipo: req.query.tipo as any,
        busqueda: req.query.busqueda as string,
        limite: parseInt(req.query.limite as string) || 50,
        offset: parseInt(req.query.offset as string) || 0,
        antesDeId: req.query.antesDeId ? parseInt(req.query.antesDeId as string) : undefined
      };

      const useCase = container.resolve(GestionarMensajesUseCase);
      const resultado = await useCase.obtenerPorConversacion(filtros);

      return res.status(200).json({
        success: true,
        mensaje: 'Mensajes obtenidos exitosamente',
        data: resultado
      });
    } catch (error: any) {
      console.error('Error al obtener mensajes:', error);
      
      if (error.message.includes('No tienes acceso')) {
        return res.status(403).json({ 
          success: false,
          error: error.message });
      }
      
      return res.status(500).json({ 
        success: false,
        error: error.message || 'Error interno del servidor' });
    }
  }

  /**
   * Crea un nuevo mensaje
   * POST /api/conversaciones/:conversacionId/mensajes
   */
  async crearMensaje(req: Request, res: Response): Promise<Response> {
    try {
      const conversacionId = parseInt(req.params.conversacionId as string);
      const usuarioId = (req as any).usuarioId;

      if (!usuarioId) {
        return res.status(401).json({ 
          success: false,
          error: 'No autorizado' 
        });
      }

      const { contenido, tipo, mediaId } = req.body;

      const dto: CrearMensajeDto = {
        conversacionId,
        remitenteId: usuarioId,
        contenido,
        tipo: tipo ? tipo.toLowerCase() : 'texto', // Normalizar a minúsculas
        mediaId: mediaId ? parseInt(mediaId) : undefined
      };

      const useCase = container.resolve(GestionarMensajesUseCase);
      const mensaje = await useCase.crear(dto);

      // Obtener la conversación para saber los participantes
      const conversacionesRepository = container.resolve<IConversacionesRepository>('ConversacionesRepository');
      const conversacion = await conversacionesRepository.obtenerPorId(conversacionId);

      // Obtener el mensaje completo con datos del remitente para WebSocket
      const mensajeCompleto = await useCase.obtenerConRemitentesPorId(mensaje.id);

      // Enviar mensaje en tiempo real via WebSocket
      if (mensajeCompleto && conversacion) {
        const wsService = container.resolve(ChatWebSocketService);
        wsService.enviarMensaje(
          conversacionId, 
          mensaje, 
          mensajeCompleto,
          { emisorId: conversacion.emisorId, receptorId: conversacion.receptorId }
        );
      }

      // Obtener contador de no leídos para el otro usuario
      // (esto lo manejaremos cuando el otro usuario abra la conversación)

      return res.status(201).json({
        mensaje: 'Mensaje enviado exitosamente',
        data: mensaje.toJSON()
      });
    } catch (error: any) {
      console.error('Error al crear mensaje:', error);
      
      if (error.name === 'ConversacionNoEncontradaError') {
        return res.status(404).json({ 
          success: false,
          error: error.message });
      }
      
      if (error.name === 'AccesoConversacionDenegadoError' || error.name === 'MensajeInvalidoError') {
        return res.status(400).json({ 
          success: false,
          error: error.message });
      }
      
      return res.status(500).json({ 
        success: false,
        error: error.message || 'Error interno del servidor' });
    }
  }

  /**
   * Actualiza un mensaje (editar)
   * PATCH /api/mensajes/:id
   */
  async actualizarMensaje(req: Request, res: Response): Promise<Response> {
    try {
      const mensajeId = parseInt(req.params.id as string);
      const usuarioId = (req as any).usuarioId;

      if (!usuarioId) {
        return res.status(401).json({ 
          success: false,
          error: 'No autorizado' 
        });
      }

      const { contenido } = req.body;

      if (!contenido) {
        return res.status(400).json({
          success: false,
          error: 'El contenido es requerido para actualizar el mensaje'
        });
      }

      const dto: ActualizarMensajeDto = {
        contenido
      };

      const useCase = container.resolve(GestionarMensajesUseCase);
      const mensaje = await useCase.actualizar(mensajeId, usuarioId, dto);

      // Notificar via WebSocket
      const wsService = container.resolve(ChatWebSocketService);
      wsService.notificarMensajeEditado(mensaje.conversacionId, mensaje);

      return res.status(200).json({
        success: true,
        mensaje: 'Mensaje actualizado exitosamente',
        data: mensaje.toJSON()
      });
    } catch (error: any) {
      console.error('Error al actualizar mensaje:', error);
      
      if (error.name === 'MensajeNoEncontradoError') {
        return res.status(404).json({ 
          success: false,
          error: error.message });
      }
      
      if (error.name === 'AccesoMensajeDenegadoError') {
        return res.status(403).json({ 
          success: false,
          error: error.message });
      }
      
      return res.status(500).json({ 
        success: false,
        error: error.message || 'Error interno del servidor' });
    }
  }

  /**
   * Elimina un mensaje
   * DELETE /api/mensajes/:id
   */
  async eliminarMensaje(req: Request, res: Response): Promise<Response> {
    try {
      const mensajeId = parseInt(req.params.id as string);
      const usuarioId = (req as any).usuarioId;

      if (!usuarioId) {
        return res.status(401).json({ 
          success: false,
          error: 'No autorizado' 
        });
      }

      // Primero obtener el mensaje para saber la conversación
      const useCase = container.resolve(GestionarMensajesUseCase);
      const mensaje = await useCase.obtenerPorId(mensajeId, usuarioId);
      const conversacionId = mensaje.conversacionId;

      await useCase.eliminar(mensajeId, usuarioId);

      // Notificar via WebSocket
      const wsService = container.resolve(ChatWebSocketService);
      wsService.notificarMensajeEliminado(conversacionId, mensajeId);

      return res.status(200).json({
        success: true,
        mensaje: 'Mensaje eliminado exitosamente'
      });
    } catch (error: any) {
      console.error('Error al eliminar mensaje:', error);
      
      if (error.name === 'MensajeNoEncontradoError') {
        return res.status(404).json({ 
          success: false,
          error: error.message });
      }
      
      if (error.name === 'AccesoMensajeDenegadoError') {
        return res.status(403).json({ 
          success: false,
          error: error.message });
      }
      
      return res.status(500).json({ 
        success: false,
        error: error.message || 'Error interno del servidor' });
    }
  }

  /**
   * Marca mensajes como leídos
   * POST /api/conversaciones/:conversacionId/marcar-leidos
   */
  async marcarMensajesLeidos(req: Request, res: Response): Promise<Response> {
    try {
      const conversacionId = parseInt(req.params.conversacionId as string);
      const usuarioId = (req as any).usuarioId;

      if (!usuarioId) {
        return res.status(401).json({ 
          success: false,
          error: 'No autorizado' });
      }

      const { ultimoMensajeLeidoId } = req.body;

      if (!ultimoMensajeLeidoId) {
        return res.status(400).json({ 
          success: false,
          error: 'ultimoMensajeLeidoId es requerido' });
      }

      const dto: MarcarMensajesLeidosDto = {
        conversacionId,
        usuarioId,
        ultimoMensajeLeidoId: parseInt(ultimoMensajeLeidoId)
      };

      const useCase = container.resolve(GestionarMensajesUseCase);
      await useCase.marcarComoLeidos(dto);

      // Notificar al otro usuario via WebSocket
      const wsService = container.resolve(ChatWebSocketService);
      wsService.notificarContadorNoLeidos(usuarioId, conversacionId, 0);

      return res.status(200).json({
        success: true,
        mensaje: 'Mensajes marcados como leídos exitosamente'
      });
    } catch (error: any) {
      console.error('Error al marcar mensajes como leídos:', error);
      
      if (error.name === 'AccesoConversacionDenegadoError') {
        return res.status(403).json({ 
          success: false,
          error: error.message });
      }
      
      return res.status(500).json({ 
        success: false,
        error: error.message || 'Error interno del servidor' });
    }
  }

  /**
   * Cuenta mensajes no leídos en una conversación
   * GET /api/conversaciones/:conversacionId/no-leidos
   */
  async contarNoLeidos(req: Request, res: Response): Promise<Response> {
    try {
      const conversacionId = parseInt(req.params.conversacionId as string);
      const usuarioId = (req as any).usuarioId;

      if (!usuarioId) {
        return res.status(401).json({ 
          success: false,
          error: 'No autorizado' 
        });
      }

      const useCase = container.resolve(GestionarMensajesUseCase);
      const contador = await useCase.contarNoLeidos(conversacionId, usuarioId);

      return res.status(200).json({
        success: true,
        mensaje: 'Contador obtenido exitosamente',
        data: { contador }
      });
    } catch (error: any) {
      console.error('Error al contar mensajes no leídos:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message || 'Error interno del servidor'  
      });
    }
  }

  /**
   * Busca mensajes en una conversación
   * GET /api/conversaciones/:conversacionId/buscar
   */
  async buscarMensajes(req: Request, res: Response): Promise<Response> {
    try {
      const conversacionId = parseInt(req.params.conversacionId as string);
      const usuarioId = (req as any).usuarioId;
      const busqueda = req.query.q as string;

      if (!usuarioId) {
        return res.status(401).json({ 
          success: false,
          error: 'No autorizado'
        });
      }

      if (!busqueda) {
        return res.status(400).json({ 
          success: false,
          error: 'Parámetro de búsqueda (q) es requerido' 
        });
      }

      const useCase = container.resolve(GestionarMensajesUseCase);
      const mensajes = await useCase.buscar(conversacionId, usuarioId, busqueda);

      return res.status(200).json({
        success: true,
        mensaje: 'Búsqueda realizada exitosamente',
        data: { mensajes, total: mensajes.length }
      });
    } catch (error: any) {
      console.error('Error al buscar mensajes:', error);
      
      if (error.name === 'AccesoConversacionDenegadoError') {
        return res.status(403).json({ 
          success: false,
          error: error.message });
      }
      
      return res.status(500).json({ 
        success: false,
        error: error.message || 'Error interno del servidor' });
    }
  }
}
