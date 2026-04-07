/**
 * DTOs para gestión del perfil y ubicación de Centros de Salud
 */

export interface ActualizarCentroSaludDto {
    nombreComercial?: string;
    rnc?: string;
    tipoCentroId?: number;
    sitio_web?: string;
    descripcion?: string;
    /** Teléfono de contacto del centro (se guarda en tabla usuario) */
    telefono?: string;
    /** Dirección del centro (se guarda en tabla ubicacion) */
    direccion?: string;
}

export interface ActualizarUbicacionCentroDto {
    barrioId?: number;
    subBarrioId?: number | null;
    direccion?: string;
    codigoPostal?: string | null;
    latitud?: number;
    longitud?: number;
}
