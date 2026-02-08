import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { GestionarNotificacionesUseCase } from '../../../application/use-cases/GestionarNotificacionesUseCase';
import {
  CrearNotificacionDto,
  FiltroNotificacionesDto,
  MarcarComoLeidaDto,
  MarcarVariasLeidasDto
} from '../../../application/dtos/NotificacionDtos';
import { NotificacionesWebSocketService } from '../../external-services/NotificacionesWebSocketService';

export class NotificacionesController {
  /**
   * Obtiene las notificaciones de un usuario
   * GET /api/notificaciones
   */
  async obtenerNotificaciones(req: Request, res: Response): Promise<Response> {
    try {
      // En producción, el usuarioId vendría del token JWT del middleware de autenticación
      const usuarioId = parseInt(req.query.usuarioId as string) || (req as any).usuarioId;

      if (!usuarioId) {
        return res.status(400).json({ error: 'Usuario ID es requerido' });
      }

      const filtros: FiltroNotificacionesDto = {
        usuarioId,
        leidas: req.query.leidas === 'true' ? true : req.query.leidas === 'false' ? false : undefined,
        tipoAlerta: req.query.tipoAlerta as any,
        tipoEntidad: req.query.tipoEntidad as any,
        limite: parseInt(req.query.limite as string) || 50,
        offset: parseInt(req.query.offset as string) || 0
      };

      const useCase = container.resolve(GestionarNotificacionesUseCase);
      const resultado = await useCase.obtenerPorUsuario(filtros);

      return res.status(200).json({
        mensaje: 'Notificaciones obtenidas exitosamente',
        data: resultado
      });
    } catch (error: any) {
      console.error('Error al obtener notificaciones:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Crea una nueva notificación (típicamente usado por el sistema)
   * POST /api/notificaciones
   */
  async crearNotificacion(req: Request, res: Response): Promise<Response> {
    try {
      const dto: CrearNotificacionDto = req.body;

      if (!dto.usuarioId || !dto.titulo || !dto.mensaje) {
        return res.status(400).json({
          error: 'usuarioId, titulo y mensaje son requeridos'
        });
      }

      const useCase = container.resolve(GestionarNotificacionesUseCase);
      const notificacion = await useCase.crear(dto);

      // Enviar notificación en tiempo real
      const wsService = container.resolve(NotificacionesWebSocketService);
      wsService.enviarNotificacionAUsuario(notificacion.usuarioId, notificacion);

      // Actualizar contador de no leídas
      const contador = await useCase.contarNoLeidas(notificacion.usuarioId);
      wsService.enviarContadorNoLeidas(notificacion.usuarioId, contador);

      return res.status(201).json({
        mensaje: 'Notificación creada exitosamente',
        data: notificacion.toJSON()
      });
    } catch (error: any) {
      console.error('Error al crear notificación:', error);
      return res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  }

  /**
   * Obtiene una notificación por ID
   * GET /api/notificaciones/:id
   */
  async obtenerNotificacionPorId(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id as string);
      const usuarioId = parseInt(req.query.usuarioId as string) || (req as any).usuarioId;

      if (!usuarioId) {
        return res.status(400).json({ error: 'Usuario ID es requerido' });
      }

      const useCase = container.resolve(GestionarNotificacionesUseCase);
      const notificacion = await useCase.obtenerPorId(id, usuarioId);

      return res.status(200).json({
        mensaje: 'Notificación obtenida exitosamente',
        data: notificacion.toJSON()
      });
    } catch (error: any) {
      console.error('Error al obtener notificación:', error);
      if (error.message.includes('No tienes permiso')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message.includes('no encontrada')) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Marca una notificación como leída
   * PATCH /api/notificaciones/:id/leer
   */
  async marcarComoLeida(req: Request, res: Response): Promise<Response> {
    try {
      const notificacionId = parseInt(req.params.id as string);
      const usuarioId = parseInt(req.body.usuarioId as string) || (req as any).usuarioId;

      if (!usuarioId) {
        return res.status(400).json({ error: 'Usuario ID es requerido' });
      }

      const dto: MarcarComoLeidaDto = { notificacionId, usuarioId };

      const useCase = container.resolve(GestionarNotificacionesUseCase);
      const notificacion = await useCase.marcarComoLeida(dto);

      // Actualizar contador de no leídas en tiempo real
      const wsService = container.resolve(NotificacionesWebSocketService);
      const contador = await useCase.contarNoLeidas(usuarioId);
      wsService.enviarContadorNoLeidas(usuarioId, contador);

      return res.status(200).json({
        mensaje: 'Notificación marcada como leída',
        data: notificacion.toJSON()
      });
    } catch (error: any) {
      console.error('Error al marcar notificación como leída:', error);
      if (error.message.includes('no encontrada') || error.message.includes('no tienes permiso')) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Marca varias notificaciones como leídas
   * PATCH /api/notificaciones/leer-varias
   */
  async marcarVariasComoLeidas(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = parseInt(req.body.usuarioId as string) || (req as any).usuarioId;
      const notificacionesIds = req.body.notificacionesIds;

      if (!usuarioId) {
        return res.status(400).json({ error: 'Usuario ID es requerido' });
      }

      if (!Array.isArray(notificacionesIds) || notificacionesIds.length === 0) {
        return res.status(400).json({ error: 'notificacionesIds debe ser un array con al menos un ID' });
      }

      const dto: MarcarVariasLeidasDto = { notificacionesIds, usuarioId };

      const useCase = container.resolve(GestionarNotificacionesUseCase);
      const cantidadMarcadas = await useCase.marcarVariasComoLeidas(dto);

      // Actualizar contador de no leídas en tiempo real
      const wsService = container.resolve(NotificacionesWebSocketService);
      const contador = await useCase.contarNoLeidas(usuarioId);
      wsService.enviarContadorNoLeidas(usuarioId, contador);

      return res.status(200).json({
        mensaje: `${cantidadMarcadas} notificaciones marcadas como leídas`,
        data: { cantidadMarcadas }
      });
    } catch (error: any) {
      console.error('Error al marcar varias notificaciones como leídas:', error);
      return res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   * PATCH /api/notificaciones/leer-todas
   */
  async marcarTodasComoLeidas(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = parseInt(req.body.usuarioId as string) || (req as any).usuarioId;

      if (!usuarioId) {
        return res.status(400).json({ error: 'Usuario ID es requerido' });
      }

      const useCase = container.resolve(GestionarNotificacionesUseCase);
      const cantidadMarcadas = await useCase.marcarTodasComoLeidas(usuarioId);

      // Actualizar contador de no leídas en tiempo real
      const wsService = container.resolve(NotificacionesWebSocketService);
      wsService.enviarContadorNoLeidas(usuarioId, 0);

      return res.status(200).json({
        mensaje: `${cantidadMarcadas} notificaciones marcadas como leídas`,
        data: { cantidadMarcadas }
      });
    } catch (error: any) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Cuenta las notificaciones no leídas de un usuario
   * GET /api/notificaciones/no-leidas/contar
   */
  async contarNoLeidas(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = parseInt(req.query.usuarioId as string) || (req as any).usuarioId;

      if (!usuarioId) {
        return res.status(400).json({ error: 'Usuario ID es requerido' });
      }

      const useCase = container.resolve(GestionarNotificacionesUseCase);
      const contador = await useCase.contarNoLeidas(usuarioId);

      return res.status(200).json({
        mensaje: 'Contador obtenido exitosamente',
        data: { contador }
      });
    } catch (error: any) {
      console.error('Error al contar notificaciones no leídas:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Elimina (desactiva) una notificación
   * DELETE /api/notificaciones/:id
   */
  async eliminarNotificacion(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id as string);
      const usuarioId = parseInt(req.query.usuarioId as string) || (req as any).usuarioId;

      if (!usuarioId) {
        return res.status(400).json({ error: 'Usuario ID es requerido' });
      }

      const useCase = container.resolve(GestionarNotificacionesUseCase);
      await useCase.eliminar(id, usuarioId);

      return res.status(200).json({
        mensaje: 'Notificación eliminada exitosamente'
      });
    } catch (error: any) {
      console.error('Error al eliminar notificación:', error);
      if (error.message.includes('no encontrada') || error.message.includes('no tienes permiso')) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Elimina (desactiva) varias notificaciones
   * DELETE /api/notificaciones/eliminar-varias
   */
  async eliminarVarias(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = parseInt(req.body.usuarioId as string) || (req as any).usuarioId;
      const notificacionesIds = req.body.notificacionesIds;

      if (!usuarioId) {
        return res.status(400).json({ error: 'Usuario ID es requerido' });
      }

      if (!Array.isArray(notificacionesIds) || notificacionesIds.length === 0) {
        return res.status(400).json({ error: 'notificacionesIds debe ser un array con al menos un ID' });
      }

      const useCase = container.resolve(GestionarNotificacionesUseCase);
      const cantidadEliminadas = await useCase.eliminarVarias(notificacionesIds, usuarioId);

      return res.status(200).json({
        mensaje: `${cantidadEliminadas} notificaciones eliminadas exitosamente`,
        data: { cantidadEliminadas }
      });
    } catch (error: any) {
      console.error('Error al eliminar varias notificaciones:', error);
      return res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  }
}
