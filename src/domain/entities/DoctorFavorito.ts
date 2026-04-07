/**
 * DoctorFavorito.ts — Entidad de dominio
 */
export class DoctorFavorito {
    constructor(
        public readonly pacienteId: number,
        public readonly doctorId: number,
        public readonly agregadoEn: Date,
        public readonly estado: string,
        /** Datos enriquecidos del doctor (opcionales, se cargan en consultas de listado) */
        public readonly doctor?: {
            usuarioId: number;
            nombre: string;
            apellido: string;
            calificacionPromedio: number | null;
            especialidades?: { id: number; nombre: string; esPrincipal: boolean }[];
            usuario?: { fotoPerfil: string | null };
        }
    ) { }

    toJSON() {
        return {
            pacienteId: this.pacienteId,
            doctorId: this.doctorId,
            agregadoEn: this.agregadoEn,
            estado: this.estado,
            doctor: this.doctor ?? undefined,
        };
    }
}
