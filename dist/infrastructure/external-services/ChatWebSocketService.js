"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatWebSocketService = void 0;
const tsyringe_1 = require("tsyringe");
let ChatWebSocketService = class ChatWebSocketService {
    constructor() {
        this.io = null;
        this.usuariosConectados = new Map();
    }
    /**
     * Obtiene la instancia de Socket.IO desde NotificacionesWebSocketService
     */
    inicializar(io) {
        this.io = io;
        // Los eventos de chat ya están dentro del namespace general de socket.io
        // Solo necesitamos agregar los handlers específicos de chat
        this.io.on('connection', (socket) => {
            this.configurarEventosChat(socket);
        });
        console.log('✅ Servicio de Chat WebSocket inicializado');
    }
    /**
     * Configura los eventos específicos de chat para un socket
     */
    configurarEventosChat(socket) {
        const usuarioId = socket.usuarioId;
        // Evento para unirse a una conversación específica
        socket.on('unirse-conversacion', (conversacionId) => {
            const sala = `conversacion:${conversacionId}`;
            socket.join(sala);
            console.log(`Usuario ${usuarioId} se unió a la conversación ${conversacionId}`);
        });
        // Evento para salir de una conversación
        socket.on('salir-conversacion', (conversacionId) => {
            const sala = `conversacion:${conversacionId}`;
            socket.leave(sala);
            console.log(`Usuario ${usuarioId} salió de la conversación ${conversacionId}`);
        });
        // Evento cuando un usuario está escribiendo
        socket.on('usuario-escribiendo', (data) => {
            const sala = `conversacion:${data.conversacionId}`;
            socket.to(sala).emit('usuario-escribiendo', {
                conversacionId: data.conversacionId,
                usuarioId,
                nombre: data.nombre
            });
        });
        // Evento cuando un usuario deja de escribir
        socket.on('usuario-dejo-escribir', (data) => {
            const sala = `conversacion:${data.conversacionId}`;
            socket.to(sala).emit('usuario-dejo-escribir', {
                conversacionId: data.conversacionId,
                usuarioId
            });
        });
        // Evento para notificar que se leyeron mensajes
        socket.on('mensajes-leidos', (data) => {
            const sala = `conversacion:${data.conversacionId}`;
            socket.to(sala).emit('mensajes-leidos', data);
        });
    }
    /**
     * Envía un nuevo mensaje a todos los participantes de una conversación
     */
    enviarMensaje(conversacionId, mensaje, datosAdicionales, participantesIds) {
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
    notificarMensajeEditado(conversacionId, mensaje) {
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
    notificarMensajeEliminado(conversacionId, mensajeId) {
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
    notificarNuevaConversacion(usuarioId, conversacion, datosAdicionales) {
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
    notificarConversacionActualizada(conversacion, usuarioId) {
        if (!this.io) {
            console.error('WebSocket no inicializado');
            return;
        }
        // Notificar a ambos participantes
        const participantes = [conversacion.emisorId, conversacion.receptorId];
        participantes.forEach(participanteId => {
            const sala = `usuario:${participanteId}`;
            this.io.to(sala).emit('conversacion-actualizada', conversacion.toJSON());
        });
        console.log(`🔄 Conversación ${conversacion.id} actualizada notificada`);
    }
    /**
     * Notifica a un usuario sobre el contador de mensajes no leídos
     */
    notificarContadorNoLeidos(usuarioId, conversacionId, contador) {
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
    usuarioEstaConectado(usuarioId) {
        const conexiones = this.usuariosConectados.get(usuarioId);
        return conexiones !== undefined && conexiones.length > 0;
    }
    /**
     * Obtiene el estado de conexión de múltiples usuarios
     */
    obtenerEstadoConexionUsuarios(usuariosIds) {
        const estados = new Map();
        usuariosIds.forEach(usuarioId => {
            estados.set(usuarioId, this.usuarioEstaConectado(usuarioId));
        });
        return estados;
    }
    /**
     * Obtiene la instancia de Socket.IO
     */
    obtenerIO() {
        return this.io;
    }
};
exports.ChatWebSocketService = ChatWebSocketService;
exports.ChatWebSocketService = ChatWebSocketService = __decorate([
    (0, tsyringe_1.injectable)()
], ChatWebSocketService);
