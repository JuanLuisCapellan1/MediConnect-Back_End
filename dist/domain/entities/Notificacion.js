"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notificacion = void 0;
class Notificacion {
    constructor(id, usuarioId, titulo, mensaje, tipoAlerta = 'Informacion', tipoEntidad, entidadId, leidaEn, estado = 'Activo', creadoEn = new Date()) {
        this.id = id;
        this.usuarioId = usuarioId;
        this.titulo = titulo;
        this.mensaje = mensaje;
        this.tipoAlerta = tipoAlerta;
        this.tipoEntidad = tipoEntidad;
        this.entidadId = entidadId;
        this.leidaEn = leidaEn;
        this.estado = estado;
        this.creadoEn = creadoEn;
    }
    esLeida() {
        return this.leidaEn !== undefined && this.leidaEn !== null;
    }
    esActiva() {
        return this.estado === 'Activo';
    }
    marcarComoLeida() {
        if (!this.esLeida()) {
            this.leidaEn = new Date();
        }
    }
    desactivar() {
        this.estado = 'Inactivo';
    }
    toJSON() {
        return {
            id: this.id,
            usuarioId: this.usuarioId,
            titulo: this.titulo,
            mensaje: this.mensaje,
            tipoAlerta: this.tipoAlerta,
            tipoEntidad: this.tipoEntidad,
            entidadId: this.entidadId,
            leida: this.esLeida(),
            leidaEn: this.leidaEn,
            estado: this.estado,
            creadoEn: this.creadoEn
        };
    }
}
exports.Notificacion = Notificacion;
