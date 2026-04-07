"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LecturaConversacion = void 0;
class LecturaConversacion {
    constructor(conversacionId, usuarioId, ultimoMensajeLeidoId, leidoEn = new Date()) {
        this.conversacionId = conversacionId;
        this.usuarioId = usuarioId;
        this.ultimoMensajeLeidoId = ultimoMensajeLeidoId;
        this.leidoEn = leidoEn;
    }
    /**
     * Actualiza el último mensaje leído
     */
    actualizarUltimoMensajeLeido(mensajeId) {
        this.ultimoMensajeLeidoId = mensajeId;
        this.leidoEn = new Date();
    }
    /**
     * Verifica si se ha leído algún mensaje
     */
    hayMensajesLeidos() {
        return this.ultimoMensajeLeidoId !== undefined && this.ultimoMensajeLeidoId !== null;
    }
    toJSON() {
        return {
            conversacionId: this.conversacionId,
            usuarioId: this.usuarioId,
            ultimoMensajeLeidoId: this.ultimoMensajeLeidoId,
            leidoEn: this.leidoEn
        };
    }
}
exports.LecturaConversacion = LecturaConversacion;
