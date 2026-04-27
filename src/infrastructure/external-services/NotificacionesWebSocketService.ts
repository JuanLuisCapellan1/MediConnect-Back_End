import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { injectable } from 'tsyringe';
import jwt from 'jsonwebtoken';
import { Notificacion } from '../../domain/entities/Notificacion';

// ─── Typed Socket ─────────────────────────────────────────────────────────────
interface CustomSocket extends Socket {
  usuarioId: number;
  email: string;
  rol: string;
}

interface TokenPayload {
  userId: number;
  email: string;
  rol: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────
@injectable()
export class NotificacionesWebSocketService {
  private io: Server | null = null;
  private usuariosConectados: Map<number, string[]> = new Map(); // userId → socketIds[]

  /**
   * Inicializa el servidor de Socket.IO, configura el middleware JWT
   * y los handlers de conexión.
   */
  inicializar(httpServer: HTTPServer): void {
    // CORS_ORIGIN puede ser una URL única o una lista separada por comas.
    // Si no está definido usamos `true` (reflejar el origen del request),
    // que es la única forma de soportar credentials:true con origen dinámico.
    const rawOrigin = process.env.CORS_ORIGIN;
    const corsOrigin: string | string[] | boolean = rawOrigin
      ? rawOrigin.split(',').map((o) => o.trim())
      : true;

    this.io = new Server(httpServer, {
      pingInterval: 25000,
      pingTimeout: 60000,
      cors: {
        origin: corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/socket.io/',
    });

    // ── Middleware de autenticación JWT ───────────────────────────────────
    this.io.use((socket, next) => {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error(
          '❌ FATAL: JWT_SECRET no está definido en las variables de entorno. ' +
          'El servicio WebSocket no puede autenticar conexiones.'
        );
        return next(new Error('Error interno del servidor'));
      }

      const rawToken =
        (socket.handshake.auth as any).token ||
        socket.handshake.headers.authorization;

      if (!rawToken) {
        return next(new Error('Token de autenticación requerido'));
      }

      try {
        const token = String(rawToken).replace(/^Bearer\s+/i, '');
        const decoded = jwt.verify(token, jwtSecret) as TokenPayload;

        // Adjuntar datos de usuario al socket de forma tipada
        const customSocket = socket as unknown as CustomSocket;
        customSocket.usuarioId = decoded.userId;
        customSocket.email = decoded.email;
        customSocket.rol = decoded.rol;

        next();
      } catch (err) {
        console.error('❌ WebSocket: token inválido o expirado:', err);
        return next(new Error('Token inválido o expirado'));
      }
    });

    // ── Handler de conexión ───────────────────────────────────────────────
    this.io.on('connection', (rawSocket: Socket) => {
      this.manejarConexion(rawSocket as unknown as CustomSocket);
    });

    console.log('✅ Servicio de WebSocket inicializado');
  }

  // ─── Handlers privados ────────────────────────────────────────────────────

  private manejarConexion(socket: CustomSocket): void {
    const { usuarioId, email } = socket;

    console.log(`🔌 Usuario conectado: ${email} (ID: ${usuarioId}, Socket: ${socket.id})`);

    this.registrarSocket(usuarioId, socket.id);

    // El usuario se une a su sala personal para recibir eventos directos
    socket.join(`usuario:${usuarioId}`);

    socket.emit('conectado', {
      mensaje: 'Conectado al servidor de notificaciones',
      usuarioId,
      timestamp: new Date(),
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Usuario desconectado: ${email} (Socket: ${socket.id})`);
      this.desregistrarSocket(usuarioId, socket.id);
    });

    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });

    // Salas adicionales (ej: sala de cita para eventos de teleconsulta)
    socket.on('unirse-sala', (sala: string) => {
      socket.join(sala);
      console.log(`Usuario ${usuarioId} se unió a la sala: ${sala}`);
    });

    socket.on('salir-sala', (sala: string) => {
      socket.leave(sala);
      console.log(`Usuario ${usuarioId} salió de la sala: ${sala}`);
    });
  }

  // ─── Registro de sockets ──────────────────────────────────────────────────

  private registrarSocket(usuarioId: number, socketId: string): void {
    const existentes = this.usuariosConectados.get(usuarioId) ?? [];
    this.usuariosConectados.set(usuarioId, [...existentes, socketId]);
  }

  private desregistrarSocket(usuarioId: number, socketId: string): void {
    const existentes = this.usuariosConectados.get(usuarioId) ?? [];
    const restantes = existentes.filter(id => id !== socketId);
    if (restantes.length === 0) {
      this.usuariosConectados.delete(usuarioId);
    } else {
      this.usuariosConectados.set(usuarioId, restantes);
    }
  }

  // ─── Emisión de eventos ───────────────────────────────────────────────────

  /**
   * Envía una notificación en tiempo real a un usuario específico.
   * Emite al canal `usuario:{usuarioId}`.
   */
  enviarNotificacionAUsuario(usuarioId: number, notificacion: Notificacion): void {
    if (!this.io) {
      console.error('❌ WebSocket no inicializado — no se puede enviar notificación.');
      return;
    }
    this.io.to(`usuario:${usuarioId}`).emit('nueva-notificacion', notificacion.toJSON());
    console.log(`📬 Notificación enviada a usuario ${usuarioId}: ${notificacion.titulo}`);
  }

  /**
   * Envía una notificación a múltiples usuarios.
   */
  enviarNotificacionAUsuarios(usuariosIds: number[], notificacion: Notificacion): void {
    usuariosIds.forEach(id => this.enviarNotificacionAUsuario(id, notificacion));
  }

  /**
   * Emite el contador de notificaciones no leídas a un usuario.
   * Escuchado por el frontend para actualizar el badge de la campana.
   */
  enviarContadorNoLeidas(usuarioId: number, contador: number): void {
    if (!this.io) {
      console.error('❌ WebSocket no inicializado — no se puede enviar contador.');
      return;
    }
    this.io.to(`usuario:${usuarioId}`).emit('contador-no-leidas', { contador });
    console.log(`🔔 Contador actualizado para usuario ${usuarioId}: ${contador}`);
  }

  /**
   * Envía un evento genérico a todos los sockets de un usuario.
   * Útil para otros módulos (teleconsulta, mensajes, etc.).
   */
  emitirAUsuario(usuarioId: number, evento: string, payload: any): void {
    if (!this.io) {
      console.error(`❌ WebSocket no inicializado — no se puede emitir '${evento}'.`);
      return;
    }
    this.io.to(`usuario:${usuarioId}`).emit(evento, payload);
  }

  // ─── Estado de presencia ──────────────────────────────────────────────────

  usuarioEstaConectado(usuarioId: number): boolean {
    const sockets = this.usuariosConectados.get(usuarioId);
    return sockets !== undefined && sockets.length > 0;
  }

  obtenerNumeroUsuariosConectados(): number {
    return this.usuariosConectados.size;
  }

  obtenerUsuariosConectados(): number[] {
    return Array.from(this.usuariosConectados.keys());
  }

  /**
   * Expone la instancia de Socket.IO para que otros servicios (ej: ChatWebSocketService)
   * puedan compartir el mismo servidor.
   */
  obtenerIO(): Server | null {
    return this.io;
  }
}
