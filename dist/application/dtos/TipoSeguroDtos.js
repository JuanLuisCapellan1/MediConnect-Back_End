"use strict";
/**
 * DTOs para Tipos de Seguros
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FiltroTiposSegurosDto = exports.ActualizarTipoSeguroDto = exports.CrearTipoSeguroDto = void 0;
/**
 * DTO para crear un nuevo tipo de seguro
 */
class CrearTipoSeguroDto {
    constructor(nombre, descripcion) {
        this.nombre = nombre;
        this.descripcion = descripcion;
    }
}
exports.CrearTipoSeguroDto = CrearTipoSeguroDto;
/**
 * DTO para actualizar un tipo de seguro existente
 */
class ActualizarTipoSeguroDto {
    constructor(nombre, descripcion, estado) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.estado = estado;
    }
}
exports.ActualizarTipoSeguroDto = ActualizarTipoSeguroDto;
/**
 * DTO para filtrar tipos de seguros
 */
class FiltroTiposSegurosDto {
    constructor(estado, busqueda, pagina, limite) {
        this.estado = estado;
        this.busqueda = busqueda;
        this.pagina = pagina || 1;
        this.limite = limite || 10;
    }
}
exports.FiltroTiposSegurosDto = FiltroTiposSegurosDto;
