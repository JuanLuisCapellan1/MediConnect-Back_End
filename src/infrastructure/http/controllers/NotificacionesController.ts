import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { ObtenerNotificacionesUseCase } from '../../../application/use-cases/notificaciones/ObtenerNotificacionesUseCase';
import { MarcarNotificacionLeidaUseCase } from '../../../application/use-cases/notificaciones/MarcarNotificacionLeidaUseCase';
import { GestionarNotificacionesUseCase } from '../../../application/use-cases/GestionarNotificacionesUseCase';
import { MarcarVariasLeidasDto } from '../../../application/dtos/NotificacionDtos';

@injectable()
export class NotificacionesController {

  constructor(
    @inject(ObtenerNotificacionesUseCase)
    private readonly obtenerUC: ObtenerNotificacionesUseCase,
    @inject(MarcarNotificacionLeidaUseCase)
    private readonly marcarUC: MarcarNotificacionLeidaUseCase,
    @inject(GestionarNotificacionesUseCase)
    private readonly gestionarUC: GestionarNotificacionesUseCase,
  ) { }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private uid(req: Request): number | null {
    return req.user?.userId ?? null;
  }

  private noAuth(res: Response) {
    res.status(401).json({ success: false, message: 'No autenticado.' });
  }

  private serverError(res: Response, error: any) {
    console.error('NotificacionesController:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }

  // ─── GET /notificaciones ─────────────────────────────────────────────────
  // Obtiene las notificaciones del usuario autenticado (creadoEn DESC).
  // Query: ?leidas=false  ?tipoAlerta=Informacion  ?limite=50  ?offset=0
  async obtenerNotificaciones(req: Request, res: Response): Promise<void> {
    const usuarioId = this.uid(req);
    if (!usuarioId) { this.noAuth(res); return; }

    try {
      const offsetParam = parseInt(req.query.offset as string, 10);
      let leidasParam: boolean | undefined = undefined;
      if (req.query.leidas === 'true') leidasParam = true;
      else if (req.query.leidas === 'false') leidasParam = false;

      const resultado = await this.obtenerUC.execute({
        usuarioId,
        limite: Number(req.query.limite) || 50,
        offset: isNaN(offsetParam) ? 0 : offsetParam,
        leidas: leidasParam,
        tipoAlerta: req.query.tipoAlerta as any,
      });

      res.status(200).json({
        success: true,
        data: {
          notificaciones: resultado.notificaciones.map(n => n.toJSON()),
          noLeidas: resultado.noLeidas,
          total: resultado.total,
        },
      });
    } catch (error: any) {
      this.serverError(res, error);
    }
  }

  // ─── GET /notificaciones/no-leidas/contar ─────────────────────────────────
  async contarNoLeidas(req: Request, res: Response): Promise<void> {
    const usuarioId = this.uid(req);
    if (!usuarioId) { this.noAuth(res); return; }

    try {
      const contador = await this.gestionarUC.contarNoLeidas(usuarioId);
      res.status(200).json({ success: true, data: { contador } });
    } catch (error: any) {
      this.serverError(res, error);
    }
  }

  // ─── PATCH /notificaciones/:id/leer ───────────────────────────────────────
  // Marca una notificación como leída y emite el contador actualizado por WS.
  async marcarComoLeida(req: Request, res: Response): Promise<void> {
    const usuarioId = this.uid(req);
    if (!usuarioId) { this.noAuth(res); return; }

    const notificacionId = Number(req.params.id);
    if (isNaN(notificacionId) || notificacionId <= 0) {
      res.status(400).json({ success: false, message: 'ID de notificación inválido.' });
      return;
    }

    try {
      const notificacion = await this.marcarUC.execute(notificacionId, usuarioId);
      res.status(200).json({
        success: true,
        message: 'Notificación marcada como leída.',
        data: notificacion.toJSON(),
      });
    } catch (error: any) {
      const msg = error?.message ?? '';
      if (msg.includes('no encontrada') || msg.includes('no tienes permiso')) {
        res.status(404).json({ success: false, message: msg });
        return;
      }
      this.serverError(res, error);
    }
  }

  // ─── PATCH /notificaciones/leer-varias ───────────────────────────────────
  async marcarVariasComoLeidas(req: Request, res: Response): Promise<void> {
    const usuarioId = this.uid(req);
    if (!usuarioId) { this.noAuth(res); return; }

    const notificacionesIds: number[] = req.body.notificacionesIds;
    if (!Array.isArray(notificacionesIds) || notificacionesIds.length === 0) {
      res.status(400).json({ success: false, message: 'notificacionesIds debe ser un array con al menos un ID.' });
      return;
    }

    try {
      const dto: MarcarVariasLeidasDto = { notificacionesIds, usuarioId };
      const cantidadMarcadas = await this.gestionarUC.marcarVariasComoLeidas(dto);
      const contador = await this.gestionarUC.contarNoLeidas(usuarioId);
      // emit via WS is done inside GestionarNotificacionesUseCase omitted; done via MarcarNotificacionLeidaUseCase only for single
      res.status(200).json({
        success: true,
        message: `${cantidadMarcadas} notificaciones marcadas como leídas.`,
        data: { cantidadMarcadas, noLeidas: contador },
      });
    } catch (error: any) {
      this.serverError(res, error);
    }
  }

  // ─── PATCH /notificaciones/leer-todas ─────────────────────────────────────
  async marcarTodasComoLeidas(req: Request, res: Response): Promise<void> {
    const usuarioId = this.uid(req);
    if (!usuarioId) { this.noAuth(res); return; }

    try {
      const cantidadMarcadas = await this.gestionarUC.marcarTodasComoLeidas(usuarioId);
      res.status(200).json({
        success: true,
        message: `${cantidadMarcadas} notificaciones marcadas como leídas.`,
        data: { cantidadMarcadas },
      });
    } catch (error: any) {
      this.serverError(res, error);
    }
  }

  // ─── DELETE /notificaciones/:id ───────────────────────────────────────────
  async eliminarNotificacion(req: Request, res: Response): Promise<void> {
    const usuarioId = this.uid(req);
    if (!usuarioId) { this.noAuth(res); return; }

    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ success: false, message: 'ID de notificación inválido.' });
      return;
    }

    try {
      await this.gestionarUC.eliminar(id, usuarioId);
      res.status(200).json({ success: true, message: 'Notificación eliminada exitosamente.' });
    } catch (error: any) {
      const msg = error?.message ?? '';
      if (msg.includes('no encontrada') || msg.includes('no tienes permiso')) {
        res.status(404).json({ success: false, message: msg });
        return;
      }
      this.serverError(res, error);
    }
  }
}
