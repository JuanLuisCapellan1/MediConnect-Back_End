/**
 * DTOs para Tipos de Seguros
 */

/**
 * DTO para crear un nuevo tipo de seguro
 */
export class CrearTipoSeguroDto {
    nombre: string;
    descripcion?: string;

    constructor(nombre: string, descripcion?: string) {
        this.nombre = nombre;
        this.descripcion = descripcion;
    }
}

/**
 * DTO para actualizar un tipo de seguro existente
 */
export class ActualizarTipoSeguroDto {
    nombre?: string;
    descripcion?: string;
    estado?: 'Activo' | 'Inactivo';

    constructor(nombre?: string, descripcion?: string, estado?: 'Activo' | 'Inactivo') {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.estado = estado;
    }
}

/**
 * DTO para filtrar tipos de seguros
 */
export class FiltroTiposSegurosDto {
    estado?: string;
    busqueda?: string;
    pagina?: number;
    limite?: number;

    constructor(estado?: string, busqueda?: string, pagina?: number, limite?: number) {
        this.estado = estado;
        this.busqueda = busqueda;
        this.pagina = pagina || 1;
        this.limite = limite || 10;
    }
}
