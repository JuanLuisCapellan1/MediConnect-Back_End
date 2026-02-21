/**
 * Servicio.ts — Entidad de dominio para Servicios médicos
 */
import { ServicioImagen } from './ServicioImagen';

export class Servicio {
    constructor(
        public readonly id: number,
        public readonly doctorId: number,
        public readonly tipoServicioId: number,
        public readonly especialidadId: number,
        public readonly nombre: string,
        public readonly descripcion: string | null,
        public readonly precio: number,
        public readonly duracionMinutos: number,
        public readonly maxPacientesDia: number | null,
        public readonly calificacionPromedio: number | null,
        public readonly modalidad: string,
        public readonly estado: string,
        public readonly creadoEn: Date,
        public readonly actualizadoEn: Date | null,
        // Relaciones opcionales
        public readonly imagenes?: ServicioImagen[],
        public readonly doctor?: any,
        public readonly especialidad?: any,
        public readonly tipoServicio?: any,
        /** Horarios — cada uno lleva día, hora, ubicación y opcionalmente centro */
        public readonly horarios?: any[],
        /** Centros de salud donde se ofrece el servicio (servicios_centros_salud) */
        public readonly centros?: any[],
        /** Ubicación personalizada (cuando no se usa un centro de salud) */
        public readonly ubicacionId?: number | null,
        public readonly ubicacion?: any
    ) { }
}
