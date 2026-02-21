/**
 * ServicioDtos.ts
 *
 * Flujo de creación:
 *   Paso 1 → campos básicos (nombre, especialidad, tipo, precio, duración, imágenes)
 *   Paso 2 → sedes: cada sede es un centro de salud O una ubicación propia,
 *             con sus horarios. Un mismo servicio puede tener múltiples centros.
 */

// ─── Horario por sede ─────────────────────────────────────────────────────────
export interface HorarioSedeDto {
    /** Nombre descriptivo, ej. "Lunes mañana - Clínica A" */
    nombre: string;
    /** 1=Lunes … 7=Domingo */
    diaSemana: number;
    /** Hora de inicio "HH:MM" */
    horaInicio: string;
    /** Hora de fin "HH:MM" */
    horaFin: string;
}

// ─── Sede ─────────────────────────────────────────────────────────────────────
/**
 * Sede donde se imparte el servicio.
 * `centroSaludId` y `ubicacionId` son mutuamente excluyentes.
 */
export interface SedeServicioDto {
    centroSaludId?: number;
    ubicacionId?: number;
    horarios: HorarioSedeDto[];
}

// ─── Crear ────────────────────────────────────────────────────────────────────
export interface CrearServicioDto {
    tipoServicioId: number;
    especialidadId: number;
    nombre: string;
    descripcion?: string;
    precio: number;
    duracionMinutos: number;
    maxPacientesDia?: number;
    /** Presencial | Teleconsulta | Mixta */
    modalidad: 'Presencial' | 'Teleconsulta' | 'Mixta';
    /** Sedes (centros o ubicaciones) donde se impartirá el servicio */
    sedes?: SedeServicioDto[];
}

// ─── Actualizar ───────────────────────────────────────────────────────────────
export interface ActualizarServicioDto {
    id: number;
    tipoServicioId?: number;
    especialidadId?: number;
    nombre?: string;
    descripcion?: string;
    precio?: number;
    duracionMinutos?: number;
    maxPacientesDia?: number;
    /** Presencial | Teleconsulta | Mixta */
    modalidad?: 'Presencial' | 'Teleconsulta' | 'Mixta';
    estado?: string;
    /** Nuevas sedes a agregar con sus horarios */
    sedesAgregar?: SedeServicioDto[];
    /** IDs (centroSaludId) de sedes a desactivar */
    sedesEliminar?: number[];
    /** IDs de horarios existentes del servicio a desactivar */
    horariosEliminar?: number[];
}

// ─── Filtros ──────────────────────────────────────────────────────────────────
export interface FiltrosServicioDto {
    especialidadId?: number;
    tipoServicioId?: number;
    modalidad?: string;
    estado?: string;
    precioMin?: number;
    precioMax?: number;
}
