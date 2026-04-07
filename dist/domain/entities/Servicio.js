"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Servicio = void 0;
class Servicio {
    constructor(id, doctorId, especialidadId, nombre, descripcion, precio, duracionMinutos, maxPacientesDia, calificacionPromedio, modalidad, estado, creadoEn, actualizadoEn, 
    // Relaciones opcionales
    imagenes, doctor, especialidad, 
    /** Horarios — cada uno lleva día, hora, ubicación y opcionalmente centro */
    horarios, 
    /** Centros de salud donde se ofrece el servicio (servicios_centros_salud) */
    centros, 
    /** Ubicación personalizada (cuando no se usa un centro de salud) */
    ubicacionId, ubicacion, 
    /** Últimas reseñas del servicio */
    resenas) {
        this.id = id;
        this.doctorId = doctorId;
        this.especialidadId = especialidadId;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = precio;
        this.duracionMinutos = duracionMinutos;
        this.maxPacientesDia = maxPacientesDia;
        this.calificacionPromedio = calificacionPromedio;
        this.modalidad = modalidad;
        this.estado = estado;
        this.creadoEn = creadoEn;
        this.actualizadoEn = actualizadoEn;
        this.imagenes = imagenes;
        this.doctor = doctor;
        this.especialidad = especialidad;
        this.horarios = horarios;
        this.centros = centros;
        this.ubicacionId = ubicacionId;
        this.ubicacion = ubicacion;
        this.resenas = resenas;
    }
}
exports.Servicio = Servicio;
