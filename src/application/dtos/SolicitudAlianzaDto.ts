/**
 * DTOs para solicitudes de alianza entre doctores y centros de salud
 */

export interface CrearSolicitudAlianzaDto {
    /** ID del Doctor (si el remitente es Centro) o ID del CentroSalud (si el remitente es Doctor) */
    destinatarioId: number;
    mensaje?: string;
}

export interface ResponderSolicitudAlianzaDto {
    estado: 'Aceptada' | 'Rechazada';
    motivoRechazo?: string;
}
