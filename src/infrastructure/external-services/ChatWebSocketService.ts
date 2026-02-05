import { Server, Socket } from 'socket.io';
import { injectable, inject } from 'tsyringe';
import jwt from 'jsonwebtoken';
import { Mensaje } from '../../domain/entities/Mensaje';
import { Conversacion } from '../../domain/entities/Conversacion';

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

export interface MensajeSocketData {
  conversacionId: number;
  mensaje: any;
}

export interface UsuarioEscribiendoData {
  conversacionId: number;
  usuarioId: number;
  nombre: string;
}

export interface MensajeLeidoData {
  conversacionId: number;
  usuarioId: number;
  ultimoMensajeLeidoId: number;
}

@injectable()
export class ChatWebSocketService {
  private io: Server | null = null;
  private usuariosConectados: Map<number, UsuarioSocket[]> = new Map();

  /**
   * Obtiene la instancia de Socket.IO desde NotificacionesWebSocketService
   */
  inicializar(io: Server): void {
    this.io = io;

    // Los eventos de chat ya están dentro del namespace general de socket.io
    // Solo necesitamos agregar los handlers específicos de chat

    this.io.on('connection', (socket: Socket) => {
      this.configurarEventosChat(socket);
    });

    console.log('✅ Servicio de Chat WebSocket inicializado');
  }

  /**
   * Configura los eventos específicos de chat para un socket
   */
  private configurarEventosChat(socket: Socket): void {
    const usuarioId = (socket as any).usuarioId;

    // Evento para unirse a una conversación específica
    socket.on('unirse-conversacion', (conversacionId: number) => {
      const sala = `conversacion:${conversacionId}`;
      socket.join(sala);
      console.log(`Usuario ${usuarioId} se unió a la conversación ${conversacionId}`);
    });

    // Evento para salir de una conversación
    socket.on('salir-conversacion', (conversacionId: number) => {
      const sala = `conversacion:${conversacionId}`;
      socket.leave(sala);
      console.log(`Usuario ${usuarioId} salió de la conversación ${conversacionId}`);
    });

    // Evento cuando un usuario está escribiendo
    socket.on('usuario-escribiendo', (data: { conversacionId: number; nombre: string }) => {
      const sala = `conversacion:${data.conversacionId}`;
      socket.to(sala).emit('usuario-escribiendo', {
        conversacionId: data.conversacionId,
        usuarioId,
        nombre: data.nombre
      });
    });

    // Evento cuando un usuario deja de escribir
    socket.on('usuario-dejo-escribir', (data: { conversacionId: number }) => {
      const sala = `conversacion:${data.conversacionId}`;
      socket.to(sala).emit('usuario-dejo-escribir', {
        conversacionId: data.conversacionId,
        usuarioId
      });
    });

    // Evento para notificar que se leyeron mensajes
    socket.on('mensajes-leidos', (data: MensajeLeidoData) => {
      const sala = `conversacion:${data.conversacionId}`;
      socket.to(sala).emit('mensajes-leidos', data);
    });
  }

  /**
   * Envía un nuevo mensaje a todos los participantes de una conversación
   */
  enviarMensaje(conversacionId: number, mensaje: Mensaje, datosAdicionales?: any, participantesIds?: { emisorId: number, receptorId: number }): void {
    if (!this.io) {
      console.error('WebSocket no inicializado');
      return;
    }

    const sala = `conversacion:${conversacionId}`;
    const payload = {
      ...mensaje.toJSON(),
      ...datosAdicionales
    };

    // Emitir a la sala de la conversación (para usuarios activos en ella)
    this.io.in(sala).emit('nuevo-mensaje', payload);

    // Emitir a las salas personales de los participantes (para usuarios fuera de la conversación)
    if (participantesIds) {
      this.io.to(`usuario:${participantesIds.emisorId}`).emit('nuevo-mensaje', payload);
      this.io.to(`usuario:${participantesIds.receptorId}`).emit('nuevo-mensaje', payload);
    }

    console.log(`💬 Mensaje enviado a conversación ${conversacionId}`);
  }

  /**
   * Notifica a los participantes que un mensaje fue editado
   */
  notificarMensajeEditado(conversacionId: number, mensaje: Mensaje): void {
    if (!this.io) {
      console.error('WebSocket no inicializado');
      return;
    }

    const sala = `conversacion:${conversacionId}`;
    this.io.in(sala).emit('mensaje-editado', mensaje.toJSON());

    console.log(`✏️ Mensaje editado notificado en conversación ${conversacionId}`);
  }

  /**
   * Notifica a los participantes que un mensaje fue eliminado
   */
  notificarMensajeEliminado(conversacionId: number, mensajeId: number): void {
    if (!this.io) {
      console.error('WebSocket no inicializado');
      return;
    }

    const sala = `conversacion:${conversacionId}`;
    this.io.in(sala).emit('mensaje-eliminado', {
      conversacionId,
      mensajeId
    });

    console.log(`🗑️ Mensaje eliminado notificado en conversación ${conversacionId}`);
  }

  /**
   * Notifica a un usuario específico sobre una nueva conversación
   */
  notificarNuevaConversacion(usuarioId: number, conversacion: Conversacion, datosAdicionales?: any): void {
    if (!this.io) {
      console.error('WebSocket no inicializado');
      return;
    }

    const sala = `usuario:${usuarioId}`;
    this.io.to(sala).emit('nueva-conversacion', {
      ...conversacion.toJSON(),
      ...datosAdicionales
    });

    console.log(`📨 Nueva conversación notificada a usuario ${usuarioId}`);
  }

  /**
   * Notifica a los participantes que una conversación fue actualizada
   */
  notificarConversacionActualizada(conversacion: Conversacion, usuarioId: number): void {
    if (!this.io) {
      console.error('WebSocket no inicializado');
      return;
    }

    // Notificar a ambos participantes
    const participantes = [conversacion.emisorId, conversacion.receptorId];
    
    participantes.forEach(participanteId => {
      const sala = `usuario:${participanteId}`;
      this.io!.to(sala).emit('conversacion-actualizada', conversacion.toJSON());
    });

    console.log(`🔄 Conversación ${conversacion.id} actualizada notificada`);
  }

  /**
   * Notifica a un usuario sobre el contador de mensajes no leídos
   */
  notificarContadorNoLeidos(usuarioId: number, conversacionId: number, contador: number): void {
    if (!this.io) {
      console.error('WebSocket no inicializado');
      return;
    }

    const sala = `usuario:${usuarioId}`;
    this.io.to(sala).emit('contador-no-leidos-conversacion', {
      conversacionId,
      contador
    });
  }

  /**
   * Verifica si un usuario está conectado
   */
  usuarioEstaConectado(usuarioId: number): boolean {
    const conexiones = this.usuariosConectados.get(usuarioId);
    return conexiones !== undefined && conexiones.length > 0;
  }

  /**
   * Obtiene el estado de conexión de múltiples usuarios
   */
  obtenerEstadoConexionUsuarios(usuariosIds: number[]): Map<number, boolean> {
    const estados = new Map<number, boolean>();
    
    usuariosIds.forEach(usuarioId => {
      estados.set(usuarioId, this.usuarioEstaConectado(usuarioId));
    });

    return estados;
  }

  /**
   * Obtiene la instancia de Socket.IO
   */
  obtenerIO(): Server | null {
    return this.io;
  }
}
