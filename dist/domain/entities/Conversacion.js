"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Conversacion = void 0;
class Conversacion {
    constructor(id, emisorId, receptorId, silenciado = false, estado = 'Activa', creadoEn = new Date(), actualizadoEn) {
        this.id = id;
        this.emisorId = emisorId;
        this.receptorId = receptorId;
        this.silenciado = silenciado;
        this.estado = estado;
        this.creadoEn = creadoEn;
        this.actualizadoEn = actualizadoEn;
    }
    /**
     * Verifica si la conversación está activa
     */
    esActiva() {
        return this.estado === 'Activa';
    }
    /**
     * Verifica si la conversación está archivada
     */
    esArchivada() {
        return this.estado === 'Archivada';
    }
    /**
     * Verifica si la conversación está bloqueada
     */
    esBloqueada() {
        return this.estado === 'Bloqueada';
    }
    /**
     * Verifica si un usuario es participante de la conversación
     */
    esParticipante(usuarioId) {
        return this.emisorId === usuarioId || this.receptorId === usuarioId;
    }
    /**
     * Obtiene el ID del otro participante
     */
    obtenerOtroParticipante(usuarioId) {
        if (!this.esParticipante(usuarioId)) {
            return null;
        }
        return this.emisorId === usuarioId ? this.receptorId : this.emisorId;
    }
    /**
     * Silencia o activa las notificaciones de la conversación
     */
    silenciar(silenciado) {
        this.silenciado = silenciado;
        this.actualizadoEn = new Date();
    }
    /**
     * Archiva la conversación
     */
    archivar() {
        this.estado = 'Archivada';
        this.actualizadoEn = new Date();
    }
    /**
     * Desarchiva la conversación
     */
    desarchivar() {
        if (this.esArchivada()) {
            this.estado = 'Activa';
            this.actualizadoEn = new Date();
        }
    }
    /**
     * Bloquea la conversación
     */
    bloquear() {
        this.estado = 'Bloqueada';
        this.actualizadoEn = new Date();
    }
    /**
     * Desbloquea la conversación
     */
    desbloquear() {
        if (this.esBloqueada()) {
            this.estado = 'Activa';
            this.actualizadoEn = new Date();
        }
    }
    /**
     * Actualiza el timestamp de actualización
     */
    actualizar() {
        this.actualizadoEn = new Date();
    }
    toJSON() {
        return {
            id: this.id,
            emisorId: this.emisorId,
            receptorId: this.receptorId,
            silenciado: this.silenciado,
            estado: this.estado,
            creadoEn: this.creadoEn,
            actualizadoEn: this.actualizadoEn
        };
    }
}
exports.Conversacion = Conversacion;
