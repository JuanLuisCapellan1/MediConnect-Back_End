"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Usuario = void 0;
class Usuario {
    constructor(id, email, rol, estado, foto_perfil, telefono, password, // Opcional porque puede venir de Google
    emailVerificado = false, creadoEn, actualizadoEn) {
        this.id = id;
        this.email = email;
        this.rol = rol;
        this.estado = estado;
        this.foto_perfil = foto_perfil;
        this.telefono = telefono;
        this.password = password;
        this.emailVerificado = emailVerificado;
        this.creadoEn = creadoEn;
        this.actualizadoEn = actualizadoEn;
    }
    esActivo() {
        return this.estado === 'Activo';
    }
    esAdmin() {
        return this.rol === "Administrador";
    }
    esDoctor() {
        return this.rol === "Doctor";
    }
    esPaciente() {
        return this.rol === "Paciente";
    }
    esCentroSalud() {
        return this.rol === "Centro de Salud";
    }
    actualizarEstado(nuevoEstado) {
        this.estado = nuevoEstado;
        this.actualizadoEn = new Date();
    }
}
exports.Usuario = Usuario;
