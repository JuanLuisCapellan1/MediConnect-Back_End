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
exports.GestionarConversacionesUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const Conversacion_1 = require("../../domain/entities/Conversacion");
const LecturaConversacion_1 = require("../../domain/entities/LecturaConversacion");
const ConversacionYaExisteError_1 = require("../../domain/errors/Conversaciones/ConversacionYaExisteError");
const ConversacionNoEncontradaError_1 = require("../../domain/errors/Conversaciones/ConversacionNoEncontradaError");
const AccesoConversacionDenegadoError_1 = require("../../domain/errors/Conversaciones/AccesoConversacionDenegadoError");
const UsuarioNoEncontradoError_1 = require("../../domain/errors/Conversaciones/UsuarioNoEncontradoError");
const ConversacionMismoUsuarioError_1 = require("../../domain/errors/Conversaciones/ConversacionMismoUsuarioError");
const ConversacionNoPermitidaEntreRolesError_1 = require("../../domain/errors/Conversaciones/ConversacionNoPermitidaEntreRolesError");
let GestionarConversacionesUseCase = class GestionarConversacionesUseCase {
    constructor(conversacionesRepository, lecturasRepository, usuarioRepository) {
        this.conversacionesRepository = conversacionesRepository;
        this.lecturasRepository = lecturasRepository;
        this.usuarioRepository = usuarioRepository;
    }
    /**
     * Crea una nueva conversación entre dos usuarios
     */
    async crear(dto) {
        // Validación: No permitir conversación con el mismo usuario
        if (dto.emisorId === dto.receptorId) {
            throw new ConversacionMismoUsuarioError_1.ConversacionMismoUsuarioError(dto.emisorId);
        }
        let emisor = await this.usuarioRepository.buscarPorId(dto.emisorId);
        let receptor = await this.usuarioRepository.buscarPorId(dto.receptorId);
        // ── 1. MANEJO DE CASOS EXTREMOS (Fallback de ID de Perfil a ID de Usuario) ──
        // Si el frontend envió un ID que no se encuentra en la tabla Usuario, interceptamos
        // el flujo e intentamos buscar si por error era el ID de una tabla de perfil.
        if (!receptor) {
            console.warn(`[CHAT SEC] receptorId ${dto.receptorId} no encontrado en Usuario. Intentando mapeo de Perfil...`);
            const receptorIdReal = await this.usuarioRepository.resolverIdPerfilAUsuario(dto.receptorId);
            if (receptorIdReal !== dto.receptorId) {
                dto.receptorId = receptorIdReal;
                receptor = await this.usuarioRepository.buscarPorId(dto.receptorId);
            }
        }
        if (!emisor) {
            throw new UsuarioNoEncontradoError_1.UsuarioNoEncontradoError(dto.emisorId);
        }
        if (!receptor) {
            throw new UsuarioNoEncontradoError_1.UsuarioNoEncontradoError(dto.receptorId);
        }
        // ── 2. VALIDACIÓN ESTRICTA DE ROLES Y MAPEO ──
        this.validarRolesPermitidos(emisor.rol, receptor.rol);
        // Verificar si ya existe una conversación activa entre estos usuarios
        const conversacionExistente = await this.conversacionesRepository.obtenerPorUsuarios(dto.emisorId, dto.receptorId);
        if (conversacionExistente && conversacionExistente.esActiva()) {
            throw new ConversacionYaExisteError_1.ConversacionYaExisteError(dto.emisorId, dto.receptorId);
        }
        // Si existe pero está archivada o bloqueada, reactivarla
        if (conversacionExistente) {
            conversacionExistente.desarchivar();
            conversacionExistente.desbloquear();
            const conversacionActualizada = await this.conversacionesRepository.actualizar(conversacionExistente.id, conversacionExistente);
            if (!conversacionActualizada) {
                throw new Error('Error al reactivar la conversación');
            }
            return conversacionActualizada;
        }
        // Crear nueva conversación
        const nuevaConversacion = new Conversacion_1.Conversacion(0, // ID será asignado por la base de datos
        dto.emisorId, dto.receptorId);
        const conversacionCreada = await this.conversacionesRepository.crear(nuevaConversacion);
        // Crear registros de lectura para ambos usuarios
        const lecturaEmisor = new LecturaConversacion_1.LecturaConversacion(conversacionCreada.id, dto.emisorId, undefined);
        const lecturaReceptor = new LecturaConversacion_1.LecturaConversacion(conversacionCreada.id, dto.receptorId, undefined);
        await Promise.all([
            this.lecturasRepository.crear(lecturaEmisor),
            this.lecturasRepository.crear(lecturaReceptor)
        ]);
        return conversacionCreada;
    }
    /**
     * Obtiene todas las conversaciones de un usuario
     */
    async obtenerPorUsuario(filtros) {
        const conversaciones = await this.conversacionesRepository.obtenerPorUsuario(filtros);
        // Calcular total de mensajes no leídos
        const totalNoLeidos = conversaciones.reduce((sum, conv) => sum + conv.mensajesNoLeidos, 0);
        return {
            conversaciones,
            total: conversaciones.length,
            totalNoLeidos
        };
    }
    /**
     * Obtiene una conversación por ID
     */
    async obtenerPorId(id, usuarioId) {
        const conversacion = await this.conversacionesRepository.obtenerConUltimoMensaje(id, usuarioId);
        if (!conversacion) {
            throw new ConversacionNoEncontradaError_1.ConversacionNoEncontradaError(id);
        }
        return conversacion;
    }
    /**
     * Actualiza una conversación (silenciar, archivar, etc.)
     */
    async actualizar(id, usuarioId, dto) {
        const conversacion = await this.conversacionesRepository.obtenerPorId(id);
        if (!conversacion) {
            throw new ConversacionNoEncontradaError_1.ConversacionNoEncontradaError(id);
        }
        // Verificar que el usuario sea participante
        if (!conversacion.esParticipante(usuarioId)) {
            throw new AccesoConversacionDenegadoError_1.AccesoConversacionDenegadoError(id, usuarioId);
        }
        // Aplicar actualizaciones
        if (dto.silenciado !== undefined) {
            conversacion.silenciar(dto.silenciado);
        }
        if (dto.estado) {
            switch (dto.estado) {
                case 'Archivada':
                    conversacion.archivar();
                    break;
                case 'Bloqueada':
                    conversacion.bloquear();
                    break;
                case 'Activa':
                    conversacion.desarchivar();
                    conversacion.desbloquear();
                    break;
            }
        }
        const conversacionActualizada = await this.conversacionesRepository.actualizar(id, conversacion);
        if (!conversacionActualizada) {
            throw new Error('Error al actualizar la conversación');
        }
        return conversacionActualizada;
    }
    /**
     * Elimina una conversación
     */
    async eliminar(id, usuarioId) {
        const conversacion = await this.conversacionesRepository.obtenerPorId(id);
        if (!conversacion) {
            throw new ConversacionNoEncontradaError_1.ConversacionNoEncontradaError(id);
        }
        // Verificar que el usuario sea participante
        if (!conversacion.esParticipante(usuarioId)) {
            throw new AccesoConversacionDenegadoError_1.AccesoConversacionDenegadoError(id, usuarioId);
        }
        const eliminada = await this.conversacionesRepository.eliminar(id, usuarioId);
        if (!eliminada) {
            throw new Error('Error al eliminar la conversación');
        }
    }
    /**
     * Obtiene el conteo total de conversaciones de un usuario
     */
    async contarPorUsuario(usuarioId) {
        return await this.conversacionesRepository.contarPorUsuario(usuarioId);
    }
    /**
     * Obtiene o crea una conversación entre dos usuarios
     */
    async obtenerOCrear(emisorId, receptorId) {
        // ── 1. MANEJO DE CASOS EXTREMOS (Fallback de ID de Perfil a ID de Usuario) ──
        const receptorIdReal = await this.usuarioRepository.resolverIdPerfilAUsuario(receptorId);
        // Buscar conversación existente
        const conversacionExistente = await this.conversacionesRepository.obtenerPorUsuarios(emisorId, receptorIdReal);
        if (conversacionExistente) {
            // Si está archivada o bloqueada, reactivarla
            if (!conversacionExistente.esActiva()) {
                conversacionExistente.desarchivar();
                conversacionExistente.desbloquear();
                const actualizada = await this.conversacionesRepository.actualizar(conversacionExistente.id, conversacionExistente);
                return actualizada || conversacionExistente;
            }
            return conversacionExistente;
        }
        // Crear nueva conversación
        return await this.crear({ emisorId, receptorId: receptorIdReal });
    }
    /**
     * Valida que los roles de los usuarios permitan crear una conversación
     * Combinaciones permitidas:
     * - Doctor ↔ Paciente
     * - Centro de Salud ↔ Doctor
     * - Paciente ↔ Centro de Salud
     */
    validarRolesPermitidos(rolEmisor, rolReceptor) {
        const combinacionesPermitidas = [
            // Doctor - Paciente
            { rol1: 'Doctor', rol2: 'Paciente' },
            { rol1: 'Paciente', rol2: 'Doctor' },
            // Centro de Salud - Doctor
            { rol1: 'Centro de Salud', rol2: 'Doctor' },
            { rol1: 'Doctor', rol2: 'Centro de Salud' },
            // Paciente - Centro de Salud
            { rol1: 'Paciente', rol2: 'Centro de Salud' },
            { rol1: 'Centro de Salud', rol2: 'Paciente' }
        ];
        const esPermitida = combinacionesPermitidas.some(combinacion => (combinacion.rol1 === rolEmisor && combinacion.rol2 === rolReceptor) ||
            (combinacion.rol1 === rolReceptor && combinacion.rol2 === rolEmisor));
        if (!esPermitida) {
            throw new ConversacionNoPermitidaEntreRolesError_1.ConversacionNoPermitidaEntreRolesError(rolEmisor, rolReceptor);
        }
    }
};
exports.GestionarConversacionesUseCase = GestionarConversacionesUseCase;
exports.GestionarConversacionesUseCase = GestionarConversacionesUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('ConversacionesRepository')),
    __param(1, (0, tsyringe_1.inject)('LecturasConversacionRepository')),
    __param(2, (0, tsyringe_1.inject)('UsuarioRepository')),
    __metadata("design:paramtypes", [Object, Object, Object])
], GestionarConversacionesUseCase);
