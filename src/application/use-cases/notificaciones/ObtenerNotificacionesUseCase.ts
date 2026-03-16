import { injectable, inject } from 'tsyringe';
import { INotificacionesRepository } from '../../../domain/repositories/INotificacionesRepository';
import { Notificacion, TipoAlerta } from '../../../domain/entities/Notificacion';

export interface ObtenerNotificacionesInput {
    usuarioId: number;
    limite?: number;
    offset?: number;
    leidas?: boolean;
    tipoAlerta?: TipoAlerta;
}

@injectable()
export class ObtenerNotificacionesUseCase {
    constructor(
        @inject('NotificacionesRepository')
        private readonly repo: INotificacionesRepository,
    ) { }

    async execute(input: ObtenerNotificacionesInput): Promise<{
        notificaciones: Notificacion[];
        noLeidas: number;
        total: number;
    }> {
        const filtros = {
            usuarioId: input.usuarioId,
            leidas: input.leidas,
            limite: input.limite ?? 50,
            offset: input.offset ?? 0,
            tipoAlerta: input.tipoAlerta,
        };

        const [notificaciones, noLeidas] = await Promise.all([
            this.repo.obtenerPorUsuario(filtros),
            this.repo.contarNoLeidas(input.usuarioId),
        ]);

        return { notificaciones, noLeidas, total: notificaciones.length };
    }
}
