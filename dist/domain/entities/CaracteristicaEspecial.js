"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaracteristicaEspecial = void 0;
/**
 * Entidad CaracteristicaEspecial - Dominio
 * Representa la relación entre paciente y condición médica
 */
class CaracteristicaEspecial {
    constructor(data) {
        this.pacienteId = data.pacienteId;
        this.condicionId = data.condicionId;
        this.notas = data.notas;
        this.estado = data.estado || 'Activo';
        this.registradoEn = data.registradoEn || new Date();
        this.actualizadoEn = data.actualizadoEn;
        this.condicion = data.condicion;
    }
}
exports.CaracteristicaEspecial = CaracteristicaEspecial;
