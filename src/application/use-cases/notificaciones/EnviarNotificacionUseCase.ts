import { injectable, inject } from 'tsyringe';
import { INotificacionesRepository } from '../../../domain/repositories/INotificacionesRepository';
import { Notificacion } from '../../../domain/entities/Notificacion';
import { NotificacionesWebSocketService } from '../../../infrastructure/external-services/NotificacionesWebSocketService';

export interface EnviarNotificacionInput {
    usuarioId: number;
    titulo: string;
    mensaje: string;
    tipoAlerta?: string;
    tipoEntidad?: string;
    entidadId?: number;
}

/**
 * Caso de uso maestro: crea la notificación en BD, la emite por WebSocket
 * y actualiza el contador de no leídas del usuario en tiempo real.
 *
 * @example
 *   await enviarNotifUC.execute({ usuarioId, titulo: 'Cita confirmada', mensaje: '...', tipoAlerta: 'Exito', tipoEntidad: 'Cita', entidadId: citaId });
 */
@injectable()
export class EnviarNotificacionUseCase {
    constructor(
        @inject('NotificacionesRepository')
        private readonly repo: INotificacionesRepository,
        @inject(NotificacionesWebSocketService)
        private readonly wsService: NotificacionesWebSocketService,
    ) { }

    async execute(datos: EnviarNotificacionInput): Promise<Notificacion> {
        if (!datos.titulo?.trim()) throw new Error('El título es obligatorio.');
        if (!datos.mensaje?.trim()) throw new Error('El mensaje es obligatorio.');
        if (datos.titulo.length > 100) throw new Error('El título no puede exceder 100 caracteres.');

        const entidad = new Notificacion(
            0,
            datos.usuarioId,
            datos.titulo.trim(),
            datos.mensaje.trim(),
            (datos.tipoAlerta as any) ?? 'Informacion',
            datos.tipoEntidad as any,
            datos.entidadId,
        );

        // 1. Persistir
        const creada = await this.repo.crear(entidad);

        // 2. Emitir notificación y contador actualizado
        try {
            this.wsService.enviarNotificacionAUsuario(datos.usuarioId, creada);
            const contador = await this.repo.contarNoLeidas(datos.usuarioId);
            this.wsService.enviarContadorNoLeidas(datos.usuarioId, contador);
        } catch (wsErr) {
            console.error(`EnviarNotificacionUseCase: error WS para usuario ${datos.usuarioId}:`, wsErr);
        }

        return creada;
    }
}
