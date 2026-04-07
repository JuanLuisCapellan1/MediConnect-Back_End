import { injectable, inject } from 'tsyringe';
import { INotificacionesRepository } from '../../../domain/repositories/INotificacionesRepository';
import { Notificacion } from '../../../domain/entities/Notificacion';
import { NotificacionesWebSocketService } from '../../../infrastructure/external-services/NotificacionesWebSocketService';

@injectable()
export class MarcarNotificacionLeidaUseCase {
    constructor(
        @inject('NotificacionesRepository')
        private readonly repo: INotificacionesRepository,
        @inject(NotificacionesWebSocketService)
        private readonly wsService: NotificacionesWebSocketService,
    ) { }

    async execute(notificacionId: number, usuarioId: number): Promise<Notificacion> {
        // 1. Marcar como leída (valida automáticamente que pertenece al usuario)
        const notificacion = await this.repo.marcarComoLeida(notificacionId, usuarioId);
        if (!notificacion) {
            throw new Error('Notificación no encontrada o no tienes permiso.');
        }

        // 2. Emitir contador actualizado por WebSocket
        try {
            const contador = await this.repo.contarNoLeidas(usuarioId);
            this.wsService.enviarContadorNoLeidas(usuarioId, contador);
        } catch (wsErr) {
            console.error('MarcarNotificacionLeidaUseCase: error WS al emitir contador:', wsErr);
        }

        return notificacion;
    }
}
