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
    /** IDs de centros de salud a agregar */
    centroSaludIdsAgregar?: number[];
    /** IDs de centros de salud a desactivar */
    centroSaludIdsEliminar?: number[];
    /** IDs de ubicaciones a agregar */
    ubicacionIdsAgregar?: number[];
    /** IDs de ubicaciones a desactivar */
    ubicacionIdsEliminar?: number[];
    /** IDs de horarios existentes a vincular al servicio */
    horarioIdsAgregar?: number[];
    /** IDs de vínculos servicioHorario a desactivar */
    horariosEliminar?: number[];
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
