"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificarMensajesPendientesService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
/**
 * NotificarMensajesPendientesService
 * Este cronjob se ejecuta periódicamente para notificar a los usuarios
 * que tienen mensajes no leídos (después de 20 minutos).
 */
class NotificarMensajesPendientesService {
    constructor(prisma, enviarNotifUC) {
        this.prisma = prisma;
        this.enviarNotifUC = enviarNotifUC;
    }
    iniciar() {
        node_cron_1.default.schedule(NotificarMensajesPendientesService.INTERVALO_CRON, async () => {
            console.log(`⏰ NotificarMensajesPendientes: cron iniciado (cada 5 min).`);
            try {
                await this._procesarMensajesPendientes();
            }
            catch (err) {
                console.error('❌ NotificarMensajesPendientes: error en ciclo:', err);
            }
        });
        console.log(`✅ Job NotificarMensajesPendientes programado (cada 5 min) con retraso de ${NotificarMensajesPendientesService.TIEMPO_RETRASO_MINUTOS} min.`);
    }
    async _procesarMensajesPendientes() {
        const ahora = new Date();
        const limiteTiempo = new Date(ahora.getTime() - NotificarMensajesPendientesService.TIEMPO_RETRASO_MINUTOS * 60 * 1000);
        // Buscar lecturas_conversacion agrupadas por usuario y conversación 
        // donde haya mensajes no leídos más antiguos a 20 mins.
        // Como LecturaConversacion tiene `ultimoMensajeLeidoId`, buscaremos 
        // en la conversación si existe un mensaje cuyo ID sea mayor a ese
        // o simplemente si no hay un id leído pero hay mensajes.
        // 1. Obtener a todos los usuarios que participan en conversaciones y que tienen un "último mensaje leído" (o ignoramos).
        // Prisma no permite comparar fácilmente "M.id > L.ultimoMensajeLeidoId" en un include directo con agregación de fechas para notificar,
        // por lo que obtendremos las lecturas y cruzaremos la data.
        const lecturas = await this.prisma.lecturaConversacion.findMany({
            include: {
                conversacion: {
                    include: {
                        mensajes: {
                            where: {
                                enviadoEn: { lte: limiteTiempo } // Mensajes viejos
                            },
                            orderBy: { id: 'desc' }, // Traemos los recientes primero
                            take: 1
                        }
                    }
                }
            }
        });
        let notificacionesEnviadas = 0;
        for (const lectura of lecturas) {
            const msjNoLeidos = lectura.conversacion.mensajes;
            // Si no hay mensajes con más de 20 mins de enviados, skip
            if (msjNoLeidos.length === 0)
                continue;
            const ultimoMensaje = msjNoLeidos[0];
            // Verificar que el mensaje detectado pertenezca a OTRO remitente, no al mismo que está leyendo
            if (ultimoMensaje.remitenteId === lectura.usuarioId)
                continue;
            // Verificar si hay mensajes NUEVOS sin leer
            // Condición de falta de lectura: Si nunca ha leido o el id del ultimoMsj > ultimo leido.
            const tienePendientes = lectura.ultimoMensajeLeidoId === null ||
                ultimoMensaje.id > lectura.ultimoMensajeLeidoId;
            if (!tienePendientes)
                continue;
            // Evaluar si ya le enviamos una notificación de pendencia desde que se envió este último mensaje.
            // Si la última notificación es posterior o igual al mensaje, entonces ya fue alertado de ESTE mensaje de hace 20 mins.
            if (lectura.ultimaNotificacionEn &&
                lectura.ultimaNotificacionEn >= ultimoMensaje.enviadoEn) {
                continue;
            }
            // Procede a notificar
            try {
                await this.enviarNotifUC.execute({
                    usuarioId: lectura.usuarioId,
                    titulo: 'Mensajes Pendientes',
                    mensaje: 'Tienes mensajes sin leer esperando por tu respuesta.',
                    tipoAlerta: 'Informacion',
                    tipoEntidad: 'Mensaje',
                    entidadId: ultimoMensaje.id,
                });
                // Actualizar el timestamp de notificación
                await this.prisma.lecturaConversacion.update({
                    where: {
                        conversacionId_usuarioId: {
                            conversacionId: lectura.conversacionId,
                            usuarioId: lectura.usuarioId,
                        }
                    },
                    data: {
                        ultimaNotificacionEn: new Date()
                    }
                });
                notificacionesEnviadas++;
            }
            catch (err) {
                console.error(`❌ Error enviando alerta de msj pendiente a usuario ${lectura.usuarioId}:`, err);
            }
        }
        if (notificacionesEnviadas > 0) {
            console.log(`⏰ NotificarMensajesPendientes: enviadas ${notificacionesEnviadas} notificaciones esta ronda.`);
        }
    }
}
exports.NotificarMensajesPendientesService = NotificarMensajesPendientesService;
// Parámetros
NotificarMensajesPendientesService.TIEMPO_RETRASO_MINUTOS = 20;
NotificarMensajesPendientesService.INTERVALO_CRON = '*/5 * * * *'; // Cada 5 minutos
