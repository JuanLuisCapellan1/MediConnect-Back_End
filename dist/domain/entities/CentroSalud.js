"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CentroSalud = void 0;
class CentroSalud {
    constructor(id, usuarioId, nombreComercial, rnc, tipoCentroId, ubicacionId, telefono, sitio_web, descripcion, certificacion_sanitaria, estado = 'Activo', estadoVerificacion = 'Pendiente', creadoEn, actualizadoEn) {
        this.id = id;
        this.usuarioId = usuarioId;
        this.nombreComercial = nombreComercial;
        this.rnc = rnc;
        this.tipoCentroId = tipoCentroId;
        this.ubicacionId = ubicacionId;
        this.telefono = telefono;
        this.sitio_web = sitio_web;
        this.descripcion = descripcion;
        this.certificacion_sanitaria = certificacion_sanitaria;
        this.estado = estado;
        this.estadoVerificacion = estadoVerificacion;
        this.creadoEn = creadoEn;
        this.actualizadoEn = actualizadoEn;
    }
    esActivo() {
        return this.estado === 'Activo';
    }
    estaEnRevision() {
        return this.estadoVerificacion === 'En revisión';
    }
    esAprobado() {
        return this.estadoVerificacion === 'Aprobado';
    }
    estaRechazado() {
        return this.estadoVerificacion === 'Rechazado';
    }
    actualizarEstado(nuevoEstado) {
        this.estado = nuevoEstado;
        this.actualizadoEn = new Date();
    }
    actualizarEstadoVerificacion(nuevoEstado) {
        this.estadoVerificacion = nuevoEstado;
        this.actualizadoEn = new Date();
    }
}
exports.CentroSalud = CentroSalud;
