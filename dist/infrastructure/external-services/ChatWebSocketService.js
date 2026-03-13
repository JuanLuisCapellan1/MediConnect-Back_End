"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatWebSocketService = void 0;
const tsyringe_1 = require("tsyringe");
let ChatWebSocketService = class ChatWebSocketService {
    constructor() {
        this.io = null;
        this.usuariosConectados = new Map();
    }
    /**
     * Inicializa el servidor Socket.IO y configura el listener de conexión
     */
    inicializar(io) {
        this.io = io;
        this.io.on('connection', (socket) => {
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
    configurarEventosChat(socket) {
        const usuarioId = socket.usuarioId;
        // ── 1. Registrar conexión ─────────────────────────────────────────────────
        const usuarioSocket = {
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
        socket.on('unirse-conversacion', (conversacionId) => {
            const sala = `conversacion:${conversacionId}`;
            socket.join(sala);
            console.log(`Usuario ${usuarioId} se unió a la conversación ${conversacionId}`);
        });
        socket.on('salir-conversacion', (conversacionId) => {
            const sala = `conversacion:${conversacionId}`;
            socket.leave(sala);
            console.log(`Usuario ${usuarioId} salió de la conversación ${conversacionId}`);
        });
        // ── 4. Eventos de indicador de escritura ──────────────────────────────────
        socket.on('usuario-escribiendo', (data) => {
            const sala = `conversacion:${data.conversacionId}`;
            socket.to(sala).emit('usuario-escribiendo', {
                conversacionId: data.conversacionId,
                usuarioId,
                nombre: data.nombre,
            });
        });
        socket.on('usuario-dejo-escribir', (data) => {
            const sala = `conversacion:${data.conversacionId}`;
            socket.to(sala).emit('usuario-dejo-escribir', {
                conversacionId: data.conversacionId,
                usuarioId,
            });
        });
        // ── 5. Lectura de mensajes ─────────────────────────────────────────────────
        socket.on('mensajes-leidos', (data) => {
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
    manejarDesconexion(usuarioId, socketId) {
        const conexiones = this.usuariosConectados.get(usuarioId) || [];
        const nuevasConexiones = conexiones.filter(c => c.socketId !== socketId);
        if (nuevasConexiones.length === 0) {
            // Usuario totalmente desconectado (sin otras pestañas/dispositivos)
            this.usuariosConectados.delete(usuarioId);
            this.notificarUsuarioDesconectado(usuarioId);
        }
        else {
            // Aún tiene otras conexiones activas
            this.usuariosConectados.set(usuarioId, nuevasConexiones);
        }
        console.log(`Usuario ${usuarioId} desconectó socket ${socketId}`);
    }
    /**
     * Notifica a los contactos del usuario (con conversaciones activas) que se conectó.
     * Versión optimizada: NO hace broadcast global.
     */
    async notificarUsuarioConectado(usuarioId) {
        if (!this.io)
            return;
        try {
            const contactosIds = await this.obtenerContactosConversacionesActivas(usuarioId);
            const payload = {
                usuarioId,
                timestamp: new Date().toISOString(),
            };
            contactosIds.forEach(contactoId => {
                this.io.to(`usuario:${contactoId}`).emit('usuario-conectado', payload);
            });
            console.log(`✅ Usuario ${usuarioId} conectado — notificado a ${contactosIds.length} contacto(s)`);
        }
        catch (error) {
            console.error(`❌ Error al notificar conexión de usuario ${usuarioId}:`, error);
        }
    }
    /**
     * Notifica a los contactos del usuario (con conversaciones activas) que se desconectó.
     * Versión optimizada: NO hace broadcast global.
     */
    async notificarUsuarioDesconectado(usuarioId) {
        if (!this.io)
            return;
        try {
            const contactosIds = await this.obtenerContactosConversacionesActivas(usuarioId);
            const payload = {
                usuarioId,
                timestamp: new Date().toISOString(),
            };
            contactosIds.forEach(contactoId => {
                this.io.to(`usuario:${contactoId}`).emit('usuario-desconectado', payload);
            });
            console.log(`❌ Usuario ${usuarioId} desconectado — notificado a ${contactosIds.length} contacto(s)`);
        }
        catch (error) {
            console.error(`❌ Error al notificar desconexión de usuario ${usuarioId}:`, error);
        }
    }
    /**
     * Devuelve los IDs únicos de usuarios que tienen una conversación activa con el usuario dado.
     * Realiza una query ligera: solo lee emisorId y receptorId.
     */
    async obtenerContactosConversacionesActivas(usuarioId) {
        // Importación dinámica para evitar dependencia circular en el constructor
        const { container } = await Promise.resolve().then(() => __importStar(require('tsyringe')));
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = container.resolve('PrismaClient');
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
        const ids = conversaciones.map(conv => conv.emisorId === usuarioId ? conv.receptorId : conv.emisorId);
        return [...new Set(ids)];
    }
    // ─────────────────────────────────────────────────────────────────────────────
    // Métodos públicos de emisión de eventos
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * Envía un nuevo mensaje a todos los participantes de una conversación
     */
    enviarMensaje(conversacionId, mensaje, datosAdicionales, participantesIds) {
        if (!this.io) {
            console.error('WebSocket no inicializado');
            return;
        }
        const sala = `conversacion:${conversacionId}`;
        // Construir el payload base con la estructura enriquecida
        const buildPayload = (esPropio) => ({
            mensaje: 'Mensaje enviado exitosamente',
            data: {
                ...mensaje.toJSON(),
                ...(datosAdicionales ?? {}),
            },
            esPropio,
        });
        if (participantesIds) {
            // Emitir personalizado a cada participante en su sala personal
            this.io
                .to(`usuario:${participantesIds.emisorId}`)
                .emit('nuevo-mensaje', buildPayload(true));
            this.io
                .to(`usuario:${participantesIds.receptorId}`)
                .emit('nuevo-mensaje', buildPayload(false));
            // Emitir a la sala de conversación (para usuarios activos en ella)
            // Necesitamos saber quién de la sala es el emisor para calcular esPropio.
            // Como no podemos saber el socketId de cada uno en la sala, emitimos sin esPropio
            // a la sala y dejamos que las salas personales sean la fuente de verdad.
            // Alternativamente, si sólo hay un socket por usuario, la sala personal es suficiente.
        }
        else {
            // Sin información de participantes, emit a la sala sin diferenciación
            this.io.in(sala).emit('nuevo-mensaje', buildPayload(false));
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
        this.io.in(sala).emit('mensaje-eliminado', { conversacionId, mensajeId });
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
            ...datosAdicionales,
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
        [conversacion.emisorId, conversacion.receptorId].forEach(participanteId => {
            this.io.to(`usuario:${participanteId}`).emit('conversacion-actualizada', conversacion.toJSON());
        });
        console.log(`🔄 Conversación ${conversacion.id} actualizada notificada`);
    }
    /**
     * Notifica a un usuario sobre el contador de mensajes no leídos en una conversación
     */
    notificarContadorNoLeidos(usuarioId, conversacionId, contador) {
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
    usuarioEstaConectado(usuarioId) {
        const conexiones = this.usuariosConectados.get(usuarioId);
        return conexiones !== undefined && conexiones.length > 0;
    }
    /**
     * Obtiene el estado de conexión de múltiples usuarios de una sola vez
     */
    obtenerEstadoConexionUsuarios(usuariosIds) {
        const estados = new Map();
        usuariosIds.forEach(id => {
            estados.set(id, this.usuarioEstaConectado(id));
        });
        return estados;
    }
    /**
     * Devuelve la instancia de Socket.IO
     */
    obtenerIO() {
        return this.io;
    }
};
exports.ChatWebSocketService = ChatWebSocketService;
exports.ChatWebSocketService = ChatWebSocketService = __decorate([
    (0, tsyringe_1.injectable)()
], ChatWebSocketService);
