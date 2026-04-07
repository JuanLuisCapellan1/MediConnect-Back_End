"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Paciente = void 0;
class Paciente {
    constructor(id, usuarioId, nombre, apellido, tipoDocIdentificacion, numeroDocumentoIdentificacion, fotoDocumento, fechaNacimiento, genero, altura, peso, tipoSangre, ubicacionId, estado, creadoEn, actualizadoEn) {
        this.id = id;
        this.usuarioId = usuarioId;
        this.nombre = nombre;
        this.apellido = apellido;
        this.tipoDocIdentificacion = tipoDocIdentificacion;
        this.numeroDocumentoIdentificacion = numeroDocumentoIdentificacion;
        this.fotoDocumento = fotoDocumento;
        this.fechaNacimiento = fechaNacimiento;
        this.genero = genero;
        this.altura = altura;
        this.peso = peso;
        this.tipoSangre = tipoSangre;
        this.ubicacionId = ubicacionId;
        this.estado = estado;
        this.creadoEn = creadoEn;
        this.actualizadoEn = actualizadoEn;
    }
}
exports.Paciente = Paciente;
