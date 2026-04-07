/**
 * ServicioDtos.ts
 */

// ─── Crear ────────────────────────────────────────────────────────────────────
export interface CrearServicioDto {
    especialidadId: number;
    nombre: string;
    descripcion?: string;
    precio: number;
    duracionMinutos: number;
    sesiones?: number;
    maxPacientesDia?: number;
    /** Presencial | Teleconsulta | Mixta */
    modalidad: 'Presencial' | 'Teleconsulta' | 'Mixta';
    /** IDs de centros de salud donde se ofrecerá el servicio */
    centroSaludIds?: number[];
    /** IDs de ubicaciones donde se ofrecerá el servicio */
    ubicacionIds?: number[];
    /** IDs de horarios ya existentes del doctor a vincular al servicio */
    horarioIds?: number[];
}

// ─── Actualizar ───────────────────────────────────────────────────────────────
export interface ActualizarServicioDto {
    id: number;
    especialidadId?: number;
    nombre?: string;
    descripcion?: string;
    precio?: number;
    duracionMinutos?: number;
    sesiones?: number;
    maxPacientesDia?: number;
    /** Presencial | Teleconsulta | Mixta */
    modalidad?: 'Presencial' | 'Teleconsulta' | 'Mixta';
    estado?: string;
    /** IDs finales de centros de salud que deben quedar activos en el servicio */
    centroSaludIds?: number[];
    /** IDs finales de ubicaciones que deben quedar activas en el servicio */
    ubicacionIds?: number[];
    /** IDs finales de horarios que deben quedar vinculados al servicio */
    horarioIds?: number[];
}

// ─── Filtros ──────────────────────────────────────────────────────────────────
export interface FiltrosServicioDto {
    especialidadId?: number;
    modalidad?: string;
    estado?: string;
    precioMin?: number;
    precioMax?: number;
    diaSemana?: number;
}
