"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Doctor = void 0;
class Doctor {
    constructor(id, usuarioId, nombre, apellido, tipoDocIdentificacion, numeroDocumentoIdentificacion, fechaNacimiento, genero, nacionalidad, exequatur, biografia, anosExperiencia, estadoVerificacion, calificacionPromedio, estado, creadoEn, actualizadoEn, duracionCitaPromedio, tarifas) {
        this.id = id;
        this.usuarioId = usuarioId;
        this.nombre = nombre;
        this.apellido = apellido;
        this.tipoDocIdentificacion = tipoDocIdentificacion;
        this.numeroDocumentoIdentificacion = numeroDocumentoIdentificacion;
        this.fechaNacimiento = fechaNacimiento;
        this.genero = genero;
        this.nacionalidad = nacionalidad;
        this.exequatur = exequatur;
        this.biografia = biografia;
        this.anosExperiencia = anosExperiencia;
        this.estadoVerificacion = estadoVerificacion;
        this.calificacionPromedio = calificacionPromedio;
        this.estado = estado;
        this.creadoEn = creadoEn;
        this.actualizadoEn = actualizadoEn;
        this.duracionCitaPromedio = duracionCitaPromedio;
        this.tarifas = tarifas;
    }
}
exports.Doctor = Doctor;
