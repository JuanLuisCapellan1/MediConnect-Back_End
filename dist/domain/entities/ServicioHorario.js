"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicioHorario = void 0;
/**
 * Entidad ServicioHorario - Dominio
 * Representa la relación entre un Servicio y un Horario
 */
class ServicioHorario {
    constructor(data) {
        this.servicioId = data.servicioId;
        this.horarioId = data.horarioId;
        this.estado = data.estado || 'Activo';
        this.creadoEn = data.creadoEn || new Date();
        this.servicio = data.servicio;
        this.horario = data.horario;
    }
    /**
     * Valida que los IDs sean números válidos y mayores a 0
     */
    isValid() {
        return (this.servicioId > 0 &&
            this.horarioId > 0 &&
            this.estado.length > 0 &&
            this.creadoEn instanceof Date);
    }
    /**
     * Verifica si la relación está activa
     */
    isActive() {
        return this.estado === 'Activo';
    }
    /**
     * Desactiva la relación
     */
    deactivate() {
        this.estado = 'Inactivo';
    }
    /**
     * Activa la relación
     */
    activate() {
        this.estado = 'Activo';
    }
}
exports.ServicioHorario = ServicioHorario;
