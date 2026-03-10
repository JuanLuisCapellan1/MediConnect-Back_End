import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { container } from 'tsyringe';
import { IniciarTeleconsultaUseCase } from '../../../application/use-cases/teleconsultas/IniciarTeleconsultaUseCase';
import { FinalizarTeleconsultaUseCase } from '../../../application/use-cases/teleconsultas/FinalizarTeleconsultaUseCase';
import { ChatWebSocketService } from '../../external-services/ChatWebSocketService';

@injectable()
export class TeleconsultaController {
    constructor(
        @inject(IniciarTeleconsultaUseCase)
        private readonly iniciarUseCase: IniciarTeleconsultaUseCase,
        @inject(FinalizarTeleconsultaUseCase)
        private readonly finalizarUseCase: FinalizarTeleconsultaUseCase,
    ) { }

    /**
     * POST /teleconsultas/:citaId/iniciar
     * Solo accesible por el Doctor dueño de la cita.
     * Crea la sala en Daily.co, registra el log y retorna la URL de acceso.
     */
    async iniciar(req: Request, res: Response): Promise<void> {
        try {
            const doctorId = req.user?.userId;
            if (!doctorId) {
                res.status(401).json({ success: false, message: 'No autenticado.' });
                return;
            }

            const citaId = Number(req.params.citaId);
            if (isNaN(citaId) || citaId <= 0) {
                res.status(400).json({ success: false, message: 'El parámetro citaId debe ser un número válido.' });
                return;
            }

            const data = await this.iniciarUseCase.ejecutar(citaId, doctorId);

            res.status(200).json({
                success: true,
                message: 'Teleconsulta iniciada exitosamente.',
                data,
            });
        } catch (error) {
            this.manejarError(error, res);
        }
    }

    /**
     * POST /teleconsultas/:citaId/finalizar
     * Accesible por el Doctor O el Paciente (cualquiera puede colgar).
     * Calcula duración, marca el LogTeleconsulta como 'Finalizada',
     * destruye la sala en Daily.co y notifica al otro participante por WebSocket.
     */
    async finalizar(req: Request, res: Response): Promise<void> {
        try {
            const usuarioId = req.user?.userId;
            if (!usuarioId) {
                res.status(401).json({ success: false, message: 'No autenticado.' });
                return;
            }

            const citaId = Number(req.params.citaId);
            if (isNaN(citaId) || citaId <= 0) {
                res.status(400).json({ success: false, message: 'El parámetro citaId debe ser un número válido.' });
                return;
            }

            const resultado = await this.finalizarUseCase.ejecutar(citaId, usuarioId);

            // ── Emitir evento WebSocket para que el otro extremo cierre el video ──
            try {
                const chatWS = container.resolve(ChatWebSocketService);
                const io = chatWS.obtenerIO();
                if (io) {
                    // Notificar a la "sala" de la cita — usamos cita:{id} como canal dedicado
                    io.to(`cita:${citaId}`).emit('llamada-finalizada', {
                        citaId,
                        duracionMinutos: resultado.duracionMinutos,
                        finalizadoPor: usuarioId,
                        timestamp: new Date().toISOString(),
                    });
                }
            } catch (wsErr) {
                // No bloquear la respuesta HTTP si el socket falla
                console.error('Error al emitir llamada-finalizada por WebSocket:', wsErr);
            }

            res.status(200).json({
                success: true,
                message: resultado.mensaje,
                data: { duracionMinutos: resultado.duracionMinutos },
            });
        } catch (error) {
            this.manejarError(error, res);
        }
    }

    private manejarError(error: any, res: Response): void {
        const msg: string = error?.message ?? 'Error interno del servidor';

        if (msg.includes('no encontrad') || msg.includes('no existe')) {
            res.status(404).json({ success: false, message: msg });
            return;
        }
        if (msg.includes('No tienes permisos')) {
            res.status(403).json({ success: false, message: msg });
            return;
        }
        if (
            msg.includes('Solo se puede iniciar') ||
            msg.includes('Solo se puede finalizar') ||
            msg.includes('Aún no puedes iniciar') ||
            msg.includes('ventana de inicio') ||
            msg.includes('No existe una teleconsulta activa') ||
            msg.includes('DAILY_API_KEY') ||
            msg.includes('inválido') ||
            msg.includes('requerido')
        ) {
            res.status(400).json({ success: false, message: msg });
            return;
        }
        if (msg.includes('Daily.co')) {
            res.status(502).json({ success: false, message: msg });
            return;
        }

        console.error('Error en TeleconsultaController:', error);
        res.status(500).json({ success: false, message: msg });
    }
}
