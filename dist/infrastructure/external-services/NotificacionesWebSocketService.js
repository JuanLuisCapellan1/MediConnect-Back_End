"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificacionesWebSocketService = void 0;
const socket_io_1 = require("socket.io");
const tsyringe_1 = require("tsyringe");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
let NotificacionesWebSocketService = class NotificacionesWebSocketService {
    constructor() {
        this.io = null;
        this.usuariosConectados = new Map();
    }
    /**
     * Inicializa el servidor de WebSocket
     */
    inicializar(httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
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
                const decoded = jsonwebtoken_1.default.verify(tokenLimpio, secreto);
                // Agregar datos del usuario al socket
                socket.usuarioId = decoded.userId;
                socket.email = decoded.email;
                socket.rol = decoded.rol;
                next();
            }
            catch (error) {
                console.error('Error al verificar token:', error);
                return next(new Error('Token inválido o expirado'));
            }
        });
        // Manejar conexiones
        this.io.on('connection', (socket) => {
            this.manejarConexion(socket);
        });
        console.log('✅ Servicio de WebSocket inicializado');
    }
    /**
     * Maneja la conexión de un nuevo cliente
     */
    manejarConexion(socket) {
        const usuarioId = socket.usuarioId;
        const email = socket.email;
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
        socket.on('unirse-sala', (sala) => {
            socket.join(sala);
            console.log(`Usuario ${usuarioId} se unió a la sala: ${sala}`);
        });
        // Manejar evento para salir de salas
        socket.on('salir-sala', (sala) => {
            socket.leave(sala);
            console.log(`Usuario ${usuarioId} salió de la sala: ${sala}`);
        });
    }
    /**
     * Envía una notificación a un usuario específico
     */
    enviarNotificacionAUsuario(usuarioId, notificacion) {
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
    enviarNotificacionAUsuarios(usuariosIds, notificacion) {
        usuariosIds.forEach(usuarioId => {
            this.enviarNotificacionAUsuario(usuarioId, notificacion);
        });
    }
    /**
     * Envía una notificación broadcast a todos los usuarios conectados
     */
    enviarNotificacionBroadcast(notificacion, excepto) {
        if (!this.io) {
            console.error('WebSocket no inicializado');
            return;
        }
        if (excepto) {
            const salaExcepto = `usuario:${excepto}`;
            this.io.except(salaExcepto).emit('nueva-notificacion', notificacion.toJSON());
        }
        else {
            this.io.emit('nueva-notificacion', notificacion.toJSON());
        }
        console.log('📣 Notificación broadcast enviada a todos los usuarios');
    }
    /**
     * Envía actualización de contador de notificaciones no leídas
     */
    enviarContadorNoLeidas(usuarioId, contador) {
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
    registrarUsuario(usuarioId, socketId) {
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
    desregistrarUsuario(usuarioId, socketId) {
        const conexionesExistentes = this.usuariosConectados.get(usuarioId) || [];
        const conexionesFiltradas = conexionesExistentes.filter(c => c.socketId !== socketId);
        if (conexionesFiltradas.length === 0) {
            this.usuariosConectados.delete(usuarioId);
        }
        else {
            this.usuariosConectados.set(usuarioId, conexionesFiltradas);
        }
    }
    /**
     * Verifica si un usuario está conectado
     */
    usuarioEstaConectado(usuarioId) {
        const conexiones = this.usuariosConectados.get(usuarioId);
        return conexiones !== undefined && conexiones.length > 0;
    }
    /**
     * Obtiene el número de usuarios conectados
     */
    obtenerNumeroUsuariosConectados() {
        return this.usuariosConectados.size;
    }
    /**
     * Obtiene la lista de usuarios conectados
     */
    obtenerUsuariosConectados() {
        return Array.from(this.usuariosConectados.keys());
    }
    /**
     * Obtiene el servidor de Socket.IO
     */
    obtenerIO() {
        return this.io;
    }
};
exports.NotificacionesWebSocketService = NotificacionesWebSocketService;
exports.NotificacionesWebSocketService = NotificacionesWebSocketService = __decorate([
    (0, tsyringe_1.injectable)()
], NotificacionesWebSocketService);
