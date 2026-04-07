"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mensaje = void 0;
class Mensaje {
    constructor(id, conversacionId, remitenteId, contenido, tipo = 'texto', mediaId, estado = 'Enviado', enviadoEn = new Date()) {
        this.id = id;
        this.conversacionId = conversacionId;
        this.remitenteId = remitenteId;
        this.contenido = contenido;
        this.tipo = tipo;
        this.mediaId = mediaId;
        this.estado = estado;
        this.enviadoEn = enviadoEn;
    }
    /**
     * Verifica si el mensaje es de texto
     */
    esTexto() {
        return this.tipo === 'texto';
    }
    /**
     * Verifica si el mensaje tiene contenido multimedia
     */
    tieneMedia() {
        return this.mediaId !== undefined && this.mediaId !== null;
    }
    /**
     * Verifica si el mensaje fue editado
     */
    fueLeido() {
        return this.estado === 'Leido';
    }
    /**
     * Verifica si el mensaje fue eliminado
     */
    fueEliminado() {
        return this.estado === 'Eliminado';
    }
    /**
     * Verifica si el mensaje fue enviado por un usuario específico
     */
    fueEnviadoPor(usuarioId) {
        return this.remitenteId === usuarioId;
    }
    /**
     * Edita el contenido del mensaje
     */
    editar(nuevoContenido) {
        if (this.fueEliminado()) {
            throw new Error('No se puede editar un mensaje eliminado');
        }
        this.contenido = nuevoContenido;
    }
    /**
     * Elimina el mensaje (soft delete)
     */
    eliminar() {
        this.estado = 'Eliminado';
        this.contenido = undefined;
    }
    /**
     * Valida que el mensaje tenga contenido válido
     */
    esValido() {
        // Un mensaje es válido si tiene contenido de texto O tiene media adjunto
        return ((this.contenido !== undefined && this.contenido.trim().length > 0) ||
            this.tieneMedia());
    }
    toJSON() {
        return {
            id: this.id,
            conversacionId: this.conversacionId,
            remitenteId: this.remitenteId,
            contenido: this.fueEliminado() ? undefined : this.contenido,
            tipo: this.tipo,
            mediaId: this.mediaId,
            estado: this.estado,
            enviadoEn: this.enviadoEn,
            leido: this.fueLeido(),
            eliminado: this.fueEliminado()
        };
    }
}
exports.Mensaje = Mensaje;
