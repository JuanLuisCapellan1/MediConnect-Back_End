/**
 * Interfaz para el servicio de video (proveedor externo de videollamadas).
 * Implementaciones: DailyVideoService (Daily.co)
 */
export interface IVideoService {
    /**
     * Crea una sala de reunión privada para una teleconsulta.
     * @param citaId - ID de la cita médica (usado para nombrar la sala)
     * @param duracionMinutos - Duración estimada en minutos (define la expiración de la sala)
     * @returns urlAcceso (URL pública para unirse) y nombreSala (nombre único de la sala)
     */
    crearSalaPrivada(citaId: number, duracionMinutos: number): Promise<{
        urlAcceso: string;    // URL con token de propietario (doctor)
        urlPaciente: string;  // URL con token de participante (paciente)
        nombreSala: string;
    }>;

    /**
     * Elimina una sala de Daily.co al finalizar la teleconsulta.
     * No lanza excepción si la sala ya no existe (manejo gracioso).
     * @param nombreSala - Nombre único de la sala a destruir
     */
    eliminarSala(nombreSala: string): Promise<void>;
}
