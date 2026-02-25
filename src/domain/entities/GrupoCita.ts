/**
 * GrupoCita.ts
 * Entidad de dominio para citas recurrentes agrupadas
 */

export class GrupoCita {
    constructor(
        public readonly id: number,
        public readonly pacienteId: number,
        public readonly servicioId: number,
        public readonly horarioId: number,
        public readonly fechaInicio: Date,
        public readonly fechaFin: Date | null,
        public readonly estado: string,
        public readonly creadoEn: Date,
        public readonly descripcion?: string | null,
        /** Citas individuales generadas (opcional, se popula con JOIN) */
        public readonly citas?: any[]
    ) { }
}
