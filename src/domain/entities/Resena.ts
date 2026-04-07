/**
 * Resena.ts — Entidad de dominio para Reseñas de servicios médicos
 */
export class Resena {
    constructor(
        public readonly id: number,
        public readonly servicioId: number,
        public readonly pacienteId: number,
        public readonly doctorId: number,
        public readonly calificacion: number,
        public readonly comentario: string | null,
        public readonly estado: string,
        public readonly creadoEn: Date,
        public readonly actualizadoEn: Date | null,
        // Relaciones opcionales
        public readonly citaId?: number | null,
        public readonly paciente?: any,
        public readonly doctor?: any,
        public readonly servicio?: any,
    ) { }
}
