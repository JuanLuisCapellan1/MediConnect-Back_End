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
   * Inicializa el servidor Socket.IO y configura el listener de conexión
   */
  inicializar(io: Server): void {
    this.io = io;

    this.io.on('connection', (socket: Socket) => {
      this.configurarEventosChat(socket);
    });

    console.log('✅ Servicio de Chat WebSocket inicializado');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Configuración de eventos por socket
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Configura los eventos específicos de chat para un socket recién conectado.
   * También registra al usuario en el mapa de conectados y escucha su desconexión.
   */
  private configurarEventosChat(socket: Socket): void {
    const usuarioId = (socket as any).usuarioId;

    // ── 1. Registrar conexión ─────────────────────────────────────────────────
    const usuarioSocket: UsuarioSocket = {
      usuarioId,
      socketId: socket.id,
      conectadoEn: new Date(),
    };

    const conexiones = this.usuariosConectados.get(usuarioId) || [];
    this.usuariosConectados.set(usuarioId, [...conexiones, usuarioSocket]);

    // Notificar a los contactos con conversaciones activas
    this.notificarUsuarioConectado(usuarioId);

    // ── 2. Manejar desconexión ────────────────────────────────────────────────
    socket.on('disconnect', () => {
      this.manejarDesconexion(usuarioId, socket.id);
    });

    // ── 3. Eventos de sala ────────────────────────────────────────────────────

    socket.on('unirse-conversacion', (conversacionId: number) => {
      const sala = `conversacion:${conversacionId}`;
      socket.join(sala);
      console.log(`Usuario ${usuarioId} se unió a la conversación ${conversacionId}`);
    });

    socket.on('salir-conversacion', (conversacionId: number) => {
      const sala = `conversacion:${conversacionId}`;
      socket.leave(sala);
      console.log(`Usuario ${usuarioId} salió de la conversación ${conversacionId}`);
    });

    // ── 4. Eventos de indicador de escritura ──────────────────────────────────

    socket.on('usuario-escribiendo', (data: { conversacionId: number; nombre: string }) => {
      const sala = `conversacion:${data.conversacionId}`;
      socket.to(sala).emit('usuario-escribiendo', {
        conversacionId: data.conversacionId,
        usuarioId,
        nombre: data.nombre,
      });
    });

    socket.on('usuario-dejo-escribir', (data: { conversacionId: number }) => {
      const sala = `conversacion:${data.conversacionId}`;
      socket.to(sala).emit('usuario-dejo-escribir', {
        conversacionId: data.conversacionId,
        usuarioId,
      });
    });

    // ── 5. Lectura de mensajes ─────────────────────────────────────────────────

    socket.on('mensajes-leidos', (data: MensajeLeidoData) => {
      const sala = `conversacion:${data.conversacionId}`;
      socket.to(sala).emit('mensajes-leidos', data);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Presencia: conectado / desconectado
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Elimina el socket del mapa de conectados.
   * Si el usuario ya no tiene ninguna otra conexión activa, notifica la desconexión.
   */
  private manejarDesconexion(usuarioId: number, socketId: string): void {
    const conexiones = this.usuariosConectados.get(usuarioId) || [];
    const nuevasConexiones = conexiones.filter(c => c.socketId !== socketId);

    if (nuevasConexiones.length === 0) {
      // Usuario totalmente desconectado (sin otras pestañas/dispositivos)
      this.usuariosConectados.delete(usuarioId);
      this.notificarUsuarioDesconectado(usuarioId);
    } else {
      // Aún tiene otras conexiones activas
      this.usuariosConectados.set(usuarioId, nuevasConexiones);
    }

    console.log(`Usuario ${usuarioId} desconectó socket ${socketId}`);
  }

  /**
   * Notifica a los contactos del usuario (con conversaciones activas) que se conectó.
   * Versión optimizada: NO hace broadcast global.
   */
  private async notificarUsuarioConectado(usuarioId: number): Promise<void> {
    if (!this.io) return;

    try {
      const contactosIds = await this.obtenerContactosConversacionesActivas(usuarioId);

      const payload = {
        usuarioId,
        timestamp: new Date().toISOString(),
      };

      contactosIds.forEach(contactoId => {
        this.io!.to(`usuario:${contactoId}`).emit('usuario-conectado', payload);
      });

      console.log(`✅ Usuario ${usuarioId} conectado — notificado a ${contactosIds.length} contacto(s)`);
    } catch (error) {
      console.error(`❌ Error al notificar conexión de usuario ${usuarioId}:`, error);
    }
  }

  /**
   * Notifica a los contactos del usuario (con conversaciones activas) que se desconectó.
   * Versión optimizada: NO hace broadcast global.
   */
  private async notificarUsuarioDesconectado(usuarioId: number): Promise<void> {
    if (!this.io) return;

    try {
      const contactosIds = await this.obtenerContactosConversacionesActivas(usuarioId);

      const payload = {
        usuarioId,
        timestamp: new Date().toISOString(),
      };

      contactosIds.forEach(contactoId => {
        this.io!.to(`usuario:${contactoId}`).emit('usuario-desconectado', payload);
      });

      console.log(`❌ Usuario ${usuarioId} desconectado — notificado a ${contactosIds.length} contacto(s)`);
    } catch (error) {
      console.error(`❌ Error al notificar desconexión de usuario ${usuarioId}:`, error);
    }
  }

  /**
   * Devuelve los IDs únicos de usuarios que tienen una conversación activa con el usuario dado.
   * Realiza una query ligera: solo lee emisorId y receptorId.
   */
  private async obtenerContactosConversacionesActivas(usuarioId: number): Promise<number[]> {
    // Importación dinámica para evitar dependencia circular en el constructor
    const { container } = await import('tsyringe');
    const { PrismaClient } = await import('@prisma/client');
    const prisma = container.resolve<InstanceType<typeof PrismaClient>>('PrismaClient');

    const conversaciones = await prisma.conversacion.findMany({
      where: {
        estado: 'Activa',
        OR: [
          { emisorId: usuarioId },
          { receptorId: usuarioId },
        ],
      },
      select: {
        emisorId: true,
        receptorId: true,
      },
    });

    // Extraer el ID del otro participante y eliminar duplicados
    const ids = conversaciones.map(conv =>
      conv.emisorId === usuarioId ? conv.receptorId : conv.emisorId
    );

    return [...new Set(ids)];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Métodos públicos de emisión de eventos
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Envía un nuevo mensaje a todos los participantes de una conversación
   */
  enviarMensaje(
    conversacionId: number,
    mensaje: Mensaje,
    datosAdicionales?: any,
    participantesIds?: { emisorId: number; receptorId: number }
  ): void {
    if (!this.io) {
      console.error('WebSocket no inicializado');
      return;
    }

    const sala = `conversacion:${conversacionId}`;
    const payload = {
      ...mensaje.toJSON(),
      ...datosAdicionales,
    };

    // A la sala de conversación (usuarios activos en ella)
    this.io.in(sala).emit('nuevo-mensaje', payload);

    // A las salas personales de cada participante (usuarios en otras vistas)
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
    this.io.in(sala).emit('mensaje-eliminado', { conversacionId, mensajeId });

    console.log(`🗑️ Mensaje eliminado notificado en conversación ${conversacionId}`);
  }

  /**
   * Notifica a un usuario específico sobre una nueva conversación
   */
  notificarNuevaConversacion(
    usuarioId: number,
    conversacion: Conversacion,
    datosAdicionales?: any
  ): void {
    if (!this.io) {
      console.error('WebSocket no inicializado');
      return;
    }

    const sala = `usuario:${usuarioId}`;
    this.io.to(sala).emit('nueva-conversacion', {
      ...conversacion.toJSON(),
      ...datosAdicionales,
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

    [conversacion.emisorId, conversacion.receptorId].forEach(participanteId => {
      this.io!.to(`usuario:${participanteId}`).emit(
        'conversacion-actualizada',
        conversacion.toJSON()
      );
    });

    console.log(`🔄 Conversación ${conversacion.id} actualizada notificada`);
  }

  /**
   * Notifica a un usuario sobre el contador de mensajes no leídos en una conversación
   */
  notificarContadorNoLeidos(usuarioId: number, conversacionId: number, contador: number): void {
    if (!this.io) {
      console.error('WebSocket no inicializado');
      return;
    }

    this.io.to(`usuario:${usuarioId}`).emit('contador-no-leidos-conversacion', {
      conversacionId,
      contador,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Utilidades de estado de presencia
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Verifica si un usuario tiene al menos una conexión activa
   */
  usuarioEstaConectado(usuarioId: number): boolean {
    const conexiones = this.usuariosConectados.get(usuarioId);
    return conexiones !== undefined && conexiones.length > 0;
  }

  /**
   * Obtiene el estado de conexión de múltiples usuarios de una sola vez
   */
  obtenerEstadoConexionUsuarios(usuariosIds: number[]): Map<number, boolean> {
    const estados = new Map<number, boolean>();
    usuariosIds.forEach(id => {
      estados.set(id, this.usuarioEstaConectado(id));
    });
    return estados;
  }

  /**
   * Devuelve la instancia de Socket.IO
   */
  obtenerIO(): Server | null {
    return this.io;
  }
}
