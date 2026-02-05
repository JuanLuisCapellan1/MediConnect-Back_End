import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { injectable } from 'tsyringe';
import jwt from 'jsonwebtoken';
import { Notificacion } from '../../domain/entities/Notificacion';

interface UsuarioSocket {
  usuarioId: number;
  socketId: string;
  conectadoEn: Date;
}

interface TokenPayload {
  userId: number;
  email: string;
  rol: string;
}

@injectable()
export class NotificacionesWebSocketService {
  private io: Server | null = null;
  private usuariosConectados: Map<number, UsuarioSocket[]> = new Map();

  /**
   * Inicializa el servidor de WebSocket
   */
  inicializar(httpServer: HTTPServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      path: '/socket.io/'
    });

    // Middleware de autenticación para Socket.IO
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

      if (!token) {
        return next(new Error('Token de autenticación requerido'));
      }

      try {
        // Remover "Bearer " si existe
        const tokenLimpio = token.replace('Bearer ', '');
        const secreto = process.env.JWT_SECRET || 'secret-key-temporal';
        
        const decoded = jwt.verify(tokenLimpio, secreto) as TokenPayload;
        
        // Agregar datos del usuario al socket
        (socket as any).usuarioId = decoded.userId;
        (socket as any).email = decoded.email;
        (socket as any).rol = decoded.rol;

        next();
      } catch (error) {
        console.error('Error al verificar token:', error);
        return next(new Error('Token inválido o expirado'));
      }
    });

    // Manejar conexiones
    this.io.on('connection', (socket: Socket) => {
      this.manejarConexion(socket);
    });

    console.log('✅ Servicio de WebSocket inicializado');
  }

  /**
   * Maneja la conexión de un nuevo cliente
   */
  private manejarConexion(socket: Socket): void {
    const usuarioId = (socket as any).usuarioId;
    const email = (socket as any).email;

    console.log(`🔌 Usuario conectado: ${email} (ID: ${usuarioId}, Socket: ${socket.id})`);

    // Registrar conexión del usuario
    this.registrarUsuario(usuarioId, socket.id);

    // Unir al usuario a su sala personal
    socket.join(`usuario:${usuarioId}`);

    // Emitir evento de conexión exitosa
    socket.emit('conectado', {
      mensaje: 'Conectado al servidor de notificaciones',
      usuarioId,
      timestamp: new Date()
    });

    // Manejar desconexión
    socket.on('disconnect', () => {
      console.log(`🔌 Usuario desconectado: ${email} (Socket: ${socket.id})`);
      this.desregistrarUsuario(usuarioId, socket.id);
    });

    // Manejar solicitud de estado de conexión
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });

    // Manejar evento para unirse a salas adicionales (ej: salas de chat)
    socket.on('unirse-sala', (sala: string) => {
      socket.join(sala);
      console.log(`Usuario ${usuarioId} se unió a la sala: ${sala}`);
    });

    // Manejar evento para salir de salas
    socket.on('salir-sala', (sala: string) => {
      socket.leave(sala);
      console.log(`Usuario ${usuarioId} salió de la sala: ${sala}`);
    });
  }

  /**
   * Envía una notificación a un usuario específico
   */
  enviarNotificacionAUsuario(usuarioId: number, notificacion: Notificacion): void {
    if (!this.io) {
      console.error('WebSocket no inicializado');
      return;
    }

    const sala = `usuario:${usuarioId}`;
    this.io.to(sala).emit('nueva-notificacion', notificacion.toJSON());

    console.log(`📬 Notificación enviada a usuario ${usuarioId}: ${notificacion.titulo}`);
  }

  /**
   * Envía una notificación a múltiples usuarios
   */
  enviarNotificacionAUsuarios(usuariosIds: number[], notificacion: Notificacion): void {
    usuariosIds.forEach(usuarioId => {
      this.enviarNotificacionAUsuario(usuarioId, notificacion);
    });
  }

  /**
   * Envía una notificación broadcast a todos los usuarios conectados
   */
  enviarNotificacionBroadcast(notificacion: Notificacion, excepto?: number): void {
    if (!this.io) {
      console.error('WebSocket no inicializado');
      return;
    }

    if (excepto) {
      const salaExcepto = `usuario:${excepto}`;
      this.io.except(salaExcepto).emit('nueva-notificacion', notificacion.toJSON());
    } else {
      this.io.emit('nueva-notificacion', notificacion.toJSON());
    }

    console.log('📣 Notificación broadcast enviada a todos los usuarios');
  }

  /**
   * Envía actualización de contador de notificaciones no leídas
   */
  enviarContadorNoLeidas(usuarioId: number, contador: number): void {
    if (!this.io) {
      console.error('WebSocket no inicializado');
      return;
    }

    const sala = `usuario:${usuarioId}`;
    this.io.to(sala).emit('contador-no-leidas', { contador });

    console.log(`🔔 Contador actualizado para usuario ${usuarioId}: ${contador}`);
  }

  /**
   * Registra un usuario conectado
   */
  private registrarUsuario(usuarioId: number, socketId: string): void {
    const conexionesExistentes = this.usuariosConectados.get(usuarioId) || [];
    
    conexionesExistentes.push({
      usuarioId,
      socketId,
      conectadoEn: new Date()
    });

    this.usuariosConectados.set(usuarioId, conexionesExistentes);
  }

  /**
   * Desregistra un usuario desconectado
   */
  private desregistrarUsuario(usuarioId: number, socketId: string): void {
    const conexionesExistentes = this.usuariosConectados.get(usuarioId) || [];
    
    const conexionesFiltradas = conexionesExistentes.filter(
      c => c.socketId !== socketId
    );

    if (conexionesFiltradas.length === 0) {
      this.usuariosConectados.delete(usuarioId);
    } else {
      this.usuariosConectados.set(usuarioId, conexionesFiltradas);
    }
  }

  /**
   * Verifica si un usuario está conectado
   */
  usuarioEstaConectado(usuarioId: number): boolean {
    const conexiones = this.usuariosConectados.get(usuarioId);
    return conexiones !== undefined && conexiones.length > 0;
  }

  /**
   * Obtiene el número de usuarios conectados
   */
  obtenerNumeroUsuariosConectados(): number {
    return this.usuariosConectados.size;
  }

  /**
   * Obtiene la lista de usuarios conectados
   */
  obtenerUsuariosConectados(): number[] {
    return Array.from(this.usuariosConectados.keys());
  }

  /**
   * Obtiene el servidor de Socket.IO
   */
  obtenerIO(): Server | null {
    return this.io;
  }
}
