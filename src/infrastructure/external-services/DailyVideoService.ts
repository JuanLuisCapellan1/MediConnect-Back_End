import { injectable } from 'tsyringe';
import { IVideoService } from '../../application/interfaces/IVideoService';

const DAILY_API_URL = 'https://api.daily.co/v1/rooms';

/**
 * Implementación de IVideoService usando Daily.co como proveedor de video.
 * El backend actúa como Signaling Server: crea la sala y devuelve la URL sin procesar video.
 */
@injectable()
export class DailyVideoService implements IVideoService {

    constructor() {
        if (!process.env.DAILY_API_KEY) {
            console.warn('⚠️  DAILY_API_KEY no está configurada. El servicio de video no funcionará correctamente.');
        }
    }

    /**
     * Crea una sala de reunión privada en Daily.co.
     * La sala expirará automáticamente al cumplirse `duracionMinutos` desde ahora.
     */
    async crearSalaPrivada(citaId: number, duracionMinutos: number): Promise<{
        urlAcceso: string;
        nombreSala: string;
    }> {
        const apiKey = process.env.DAILY_API_KEY;
        if (!apiKey) {
            throw new Error('DAILY_API_KEY no está configurada en las variables de entorno.');
        }

        // Nombre único para la sala: incluye citaId y timestamp para evitar colisiones
        const nombreSala = `MediConnect-cita-${citaId}-${Date.now()}`;

        // Tiempo de expiración en segundos Unix (ahora + duración en minutos)
        const expiracion = Math.floor(Date.now() / 1000) + duracionMinutos * 60;

        const body = {
            name: nombreSala,
            privacy: 'private',
            properties: {
                enable_recording: 'none',
                exp: expiracion,
            },
        };

        const response = await fetch(DAILY_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
                `Error al crear sala en Daily.co [${response.status}]: ${errorBody}`
            );
        }

        const room = await response.json() as { url: string; name: string };

        return {
            urlAcceso: room.url,
            nombreSala: room.name,
        };
    }

    /**
     * Destruye una sala de Daily.co al finalizar la teleconsulta.
     * Maneja el caso en que la sala ya no exista (HTTP 404) sin lanzar excepción.
     */
    async eliminarSala(nombreSala: string): Promise<void> {
        const apiKey = process.env.DAILY_API_KEY;
        if (!apiKey) {
            console.error('eliminarSala: DAILY_API_KEY no configurada — la sala no será eliminada.');
            return;
        }

        try {
            const response = await fetch(`https://api.daily.co/v1/rooms/${nombreSala}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
            });

            if (response.ok || response.status === 404) {
                console.log(`🗑️  Sala Daily.co '${nombreSala}' eliminada (status: ${response.status}).`);
            } else {
                const body = await response.text();
                console.error(`❌ Error al eliminar sala '${nombreSala}' [${response.status}]: ${body}`);
            }
        } catch (err) {
            // Error de red — no bloquear el flujo
            console.error(`❌ Error de red al eliminar sala '${nombreSala}':`, err);
        }
    }
}
