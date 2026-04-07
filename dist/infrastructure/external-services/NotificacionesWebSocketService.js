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
// ─── Service ──────────────────────────────────────────────────────────────────
let NotificacionesWebSocketService = class NotificacionesWebSocketService {
    constructor() {
        this.io = null;
        this.usuariosConectados = new Map(); // userId → socketIds[]
    }
    /**
     * Inicializa el servidor de Socket.IO, configura el middleware JWT
     * y los handlers de conexión.
     */
    inicializar(httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: process.env.CORS_ORIGIN || '*',
                methods: ['GET', 'POST'],
                credentials: true,
            },
            path: '/socket.io/',
        });
        // ── Middleware de autenticación JWT ───────────────────────────────────
        this.io.use((socket, next) => {
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                console.error('❌ FATAL: JWT_SECRET no está definido en las variables de entorno. ' +
                    'El servicio WebSocket no puede autenticar conexiones.');
                return next(new Error('Error interno del servidor'));
            }
            const rawToken = socket.handshake.auth.token ||
                socket.handshake.headers.authorization;
            if (!rawToken) {
                return next(new Error('Token de autenticación requerido'));
            }
            try {
                const token = String(rawToken).replace(/^Bearer\s+/i, '');
                const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
                // Adjuntar datos de usuario al socket de forma tipada
                const customSocket = socket;
                customSocket.usuarioId = decoded.userId;
                customSocket.email = decoded.email;
                customSocket.rol = decoded.rol;
                next();
            }
            catch (err) {
                console.error('❌ WebSocket: token inválido o expirado:', err);
                return next(new Error('Token inválido o expirado'));
            }
        });
        // ── Handler de conexión ───────────────────────────────────────────────
        this.io.on('connection', (rawSocket) => {
            this.manejarConexion(rawSocket);
        });
        console.log('✅ Servicio de WebSocket inicializado');
    }
    // ─── Handlers privados ────────────────────────────────────────────────────
    manejarConexion(socket) {
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
        socket.on('unirse-sala', (sala) => {
            socket.join(sala);
            console.log(`Usuario ${usuarioId} se unió a la sala: ${sala}`);
        });
        socket.on('salir-sala', (sala) => {
            socket.leave(sala);
            console.log(`Usuario ${usuarioId} salió de la sala: ${sala}`);
        });
    }
    // ─── Registro de sockets ──────────────────────────────────────────────────
    registrarSocket(usuarioId, socketId) {
        const existentes = this.usuariosConectados.get(usuarioId) ?? [];
        this.usuariosConectados.set(usuarioId, [...existentes, socketId]);
    }
    desregistrarSocket(usuarioId, socketId) {
        const existentes = this.usuariosConectados.get(usuarioId) ?? [];
        const restantes = existentes.filter(id => id !== socketId);
        if (restantes.length === 0) {
            this.usuariosConectados.delete(usuarioId);
        }
        else {
            this.usuariosConectados.set(usuarioId, restantes);
        }
    }
    // ─── Emisión de eventos ───────────────────────────────────────────────────
    /**
     * Envía una notificación en tiempo real a un usuario específico.
     * Emite al canal `usuario:{usuarioId}`.
     */
    enviarNotificacionAUsuario(usuarioId, notificacion) {
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
    enviarNotificacionAUsuarios(usuariosIds, notificacion) {
        usuariosIds.forEach(id => this.enviarNotificacionAUsuario(id, notificacion));
    }
    /**
     * Emite el contador de notificaciones no leídas a un usuario.
     * Escuchado por el frontend para actualizar el badge de la campana.
     */
    enviarContadorNoLeidas(usuarioId, contador) {
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
    emitirAUsuario(usuarioId, evento, payload) {
        if (!this.io) {
            console.error(`❌ WebSocket no inicializado — no se puede emitir '${evento}'.`);
            return;
        }
        this.io.to(`usuario:${usuarioId}`).emit(evento, payload);
    }
    // ─── Estado de presencia ──────────────────────────────────────────────────
    usuarioEstaConectado(usuarioId) {
        const sockets = this.usuariosConectados.get(usuarioId);
        return sockets !== undefined && sockets.length > 0;
    }
    obtenerNumeroUsuariosConectados() {
        return this.usuariosConectados.size;
    }
    obtenerUsuariosConectados() {
        return Array.from(this.usuariosConectados.keys());
    }
    /**
     * Expone la instancia de Socket.IO para que otros servicios (ej: ChatWebSocketService)
     * puedan compartir el mismo servidor.
     */
    obtenerIO() {
        return this.io;
    }
};
exports.NotificacionesWebSocketService = NotificacionesWebSocketService;
exports.NotificacionesWebSocketService = NotificacionesWebSocketService = __decorate([
    (0, tsyringe_1.injectable)()
], NotificacionesWebSocketService);
