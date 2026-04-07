/**
 * ResenaDtos.ts — DTOs para el módulo de Reseñas
 */

export interface CrearResenaDto {
    servicioId: number;
    calificacion: number;       // 1 a 5
    comentario?: string | null;
    citaId?: number | null;     // Opcional: cita que origina la reseña
}

export interface FiltroResenasDto {
    pagina?: number;
    limite?: number;
}
