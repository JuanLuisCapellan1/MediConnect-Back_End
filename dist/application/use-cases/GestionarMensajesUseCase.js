"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GestionarMensajesUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const Mensaje_1 = require("../../domain/entities/Mensaje");
const MensajeNoEncontradoError_1 = require("../../domain/errors/Mensajes/MensajeNoEncontradoError");
const AccesoMensajeDenegadoError_1 = require("../../domain/errors/Mensajes/AccesoMensajeDenegadoError");
const MensajeInvalidoError_1 = require("../../domain/errors/Mensajes/MensajeInvalidoError");
const ConversacionNoEncontradaError_1 = require("../../domain/errors/Conversaciones/ConversacionNoEncontradaError");
const AccesoConversacionDenegadoError_1 = require("../../domain/errors/Conversaciones/AccesoConversacionDenegadoError");
let GestionarMensajesUseCase = class GestionarMensajesUseCase {
    constructor(mensajesRepository, conversacionesRepository, lecturasRepository, mediaRepository) {
        this.mensajesRepository = mensajesRepository;
        this.conversacionesRepository = conversacionesRepository;
        this.lecturasRepository = lecturasRepository;
        this.mediaRepository = mediaRepository;
    }
    /**
     * Crea un nuevo mensaje en una conversación
     */
    async crear(dto) {
        // Verificar que la conversación existe
        const conversacion = await this.conversacionesRepository.obtenerPorId(dto.conversacionId);
        if (!conversacion) {
            throw new ConversacionNoEncontradaError_1.ConversacionNoEncontradaError(dto.conversacionId);
        }
        // Verificar que el remitente es participante de la conversación
        if (!conversacion.esParticipante(dto.remitenteId)) {
            throw new AccesoConversacionDenegadoError_1.AccesoConversacionDenegadoError(dto.conversacionId, dto.remitenteId);
        }
        // Verificar que la conversación no esté bloqueada
        if (conversacion.esBloqueada()) {
            throw new Error('No puedes enviar mensajes en una conversación bloqueada');
        }
        // Si hay mediaId, verificar que el media existe
        if (dto.mediaId) {
            const media = await this.mediaRepository.obtenerPorId(dto.mediaId);
            if (!media || !media.esActivo()) {
                throw new Error('El archivo multimedia no existe o no está disponible');
            }
        }
        // Crear el mensaje
        const nuevoMensaje = new Mensaje_1.Mensaje(0, // ID será asignado por la base de datos
        dto.conversacionId, dto.remitenteId, dto.contenido, (dto.tipo || 'texto'), dto.mediaId, 'Enviado');
        // Validar que el mensaje sea válido
        if (!nuevoMensaje.esValido()) {
            throw new MensajeInvalidoError_1.MensajeInvalidoError('El mensaje debe tener contenido de texto o un archivo adjunto');
        }
        const mensajeCreado = await this.mensajesRepository.crear(nuevoMensaje);
        // Actualizar el timestamp de la conversación (ya se hace en el repositorio)
        return mensajeCreado;
    }
    /**
     * Obtiene un mensaje con datos del remitente por su ID
     */
    async obtenerConRemitentesPorId(id) {
        const repo = this.mensajesRepository;
        if (repo.obtenerConRemitentesPorId) {
            return await repo.obtenerConRemitentesPorId(id);
        }
        return null;
    }
    /**
     * Obtiene los mensajes de una conversación
     */
    async obtenerPorConversacion(filtros) {
        const mensajes = await this.mensajesRepository.obtenerPorConversacion(filtros);
        const limite = filtros.limite || 50;
        const hayMas = mensajes.length === limite;
        return {
            mensajes,
            total: mensajes.length,
            hayMas
        };
    }
    /**
     * Obtiene un mensaje por ID
     */
    async obtenerPorId(id, usuarioId) {
        const mensaje = await this.mensajesRepository.obtenerPorId(id);
        if (!mensaje) {
            throw new MensajeNoEncontradoError_1.MensajeNoEncontradoError(id);
        }
        // Verificar que el usuario tenga acceso a la conversación
        const conversacion = await this.conversacionesRepository.obtenerPorId(mensaje.conversacionId);
        if (!conversacion || !conversacion.esParticipante(usuarioId)) {
            throw new AccesoMensajeDenegadoError_1.AccesoMensajeDenegadoError(id, usuarioId);
        }
        return mensaje;
    }
    /**
     * Edita un mensaje existente
     */
    async actualizar(id, usuarioId, dto) {
        const mensaje = await this.mensajesRepository.obtenerPorId(id);
        if (!mensaje) {
            throw new MensajeNoEncontradoError_1.MensajeNoEncontradoError(id);
        }
        // Verificar que el usuario es el remitente
        if (!mensaje.fueEnviadoPor(usuarioId)) {
            throw new AccesoMensajeDenegadoError_1.AccesoMensajeDenegadoError(id, usuarioId);
        }
        // No se puede editar un mensaje eliminado
        if (mensaje.fueEliminado()) {
            throw new Error('No se puede editar un mensaje eliminado');
        }
        // Actualizar contenido si se proporciona
        if (dto.contenido !== undefined) {
            mensaje.editar(dto.contenido);
        }
        const mensajeActualizado = await this.mensajesRepository.actualizar(id, mensaje);
        if (!mensajeActualizado) {
            throw new Error('Error al actualizar el mensaje');
        }
        return mensajeActualizado;
    }
    /**
     * Elimina un mensaje (soft delete)
     */
    async eliminar(id, usuarioId) {
        const mensaje = await this.mensajesRepository.obtenerPorId(id);
        if (!mensaje) {
            throw new MensajeNoEncontradoError_1.MensajeNoEncontradoError(id);
        }
        // Verificar que el usuario es el remitente
        if (!mensaje.fueEnviadoPor(usuarioId)) {
            throw new AccesoMensajeDenegadoError_1.AccesoMensajeDenegadoError(id, usuarioId);
        }
        const eliminado = await this.mensajesRepository.eliminar(id, usuarioId);
        if (!eliminado) {
            throw new Error('Error al eliminar el mensaje');
        }
    }
    /**
     * Marca mensajes como leídos hasta un mensaje específico
     */
    async marcarComoLeidos(dto) {
        // Verificar que el usuario tenga acceso a la conversación
        const conversacion = await this.conversacionesRepository.obtenerPorId(dto.conversacionId);
        if (!conversacion || !conversacion.esParticipante(dto.usuarioId)) {
            throw new AccesoConversacionDenegadoError_1.AccesoConversacionDenegadoError(dto.conversacionId, dto.usuarioId);
        }
        await this.lecturasRepository.actualizarUltimoMensajeLeido(dto);
    }
    /**
     * Cuenta mensajes no leídos en una conversación
     */
    async contarNoLeidos(conversacionId, usuarioId) {
        return await this.mensajesRepository.contarNoLeidosPorConversacion(conversacionId, usuarioId);
    }
    /**
     * Busca mensajes en una conversación
     */
    async buscar(conversacionId, usuarioId, busqueda) {
        // Verificar acceso a la conversación
        const conversacion = await this.conversacionesRepository.obtenerPorId(conversacionId);
        if (!conversacion || !conversacion.esParticipante(usuarioId)) {
            throw new AccesoConversacionDenegadoError_1.AccesoConversacionDenegadoError(conversacionId, usuarioId);
        }
        return await this.mensajesRepository.buscarEnConversacion(conversacionId, busqueda);
    }
    /**
     * Obtiene el último mensaje de una conversación
     */
    async obtenerUltimo(conversacionId, usuarioId) {
        // Verificar acceso
        const conversacion = await this.conversacionesRepository.obtenerPorId(conversacionId);
        if (!conversacion || !conversacion.esParticipante(usuarioId)) {
            throw new AccesoConversacionDenegadoError_1.AccesoConversacionDenegadoError(conversacionId, usuarioId);
        }
        return await this.mensajesRepository.obtenerUltimoPorConversacion(conversacionId);
    }
};
exports.GestionarMensajesUseCase = GestionarMensajesUseCase;
exports.GestionarMensajesUseCase = GestionarMensajesUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('MensajesRepository')),
    __param(1, (0, tsyringe_1.inject)('ConversacionesRepository')),
    __param(2, (0, tsyringe_1.inject)('LecturasConversacionRepository')),
    __param(3, (0, tsyringe_1.inject)('MediaRepository')),
    __metadata("design:paramtypes", [Object, Object, Object, Object])
], GestionarMensajesUseCase);
