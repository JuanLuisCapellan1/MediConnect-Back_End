"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyVideoService = void 0;
const tsyringe_1 = require("tsyringe");
const DAILY_API_URL = 'https://api.daily.co/v1/rooms';
const DAILY_TOKENS_URL = 'https://api.daily.co/v1/meeting-tokens';
/**
 * Implementación de IVideoService usando Daily.co como proveedor de video.
 * Las salas se crean como 'private' y se generan tokens con tiempo de vida
 * limitado para el doctor (owner) y el paciente (participant).
 */
let DailyVideoService = class DailyVideoService {
    constructor() {
        if (!process.env.DAILY_API_KEY) {
            console.warn('⚠️  DAILY_API_KEY no está configurada. El servicio de video no funcionará correctamente.');
        }
    }
    /**
     * Crea una sala de reunión privada en Daily.co y devuelve:
     * - urlDoctor   → URL con token de propietario (puede controlar la sesión)
     * - urlPaciente → URL con token de participante
     * - nombreSala  → nombre bruto de la sala (para eliminación posterior)
     */
    async crearSalaPrivada(citaId, duracionMinutos) {
        const apiKey = process.env.DAILY_API_KEY;
        if (!apiKey) {
            throw new Error('DAILY_API_KEY no está configurada en las variables de entorno.');
        }
        // ── 1. Crear la sala ──────────────────────────────────────────────────
        const nombreSala = `MediConnect-cita-${citaId}-${Date.now()}`;
        const expiracion = Math.floor(Date.now() / 1000) + duracionMinutos * 60;
        const roomRes = await fetch(DAILY_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                name: nombreSala,
                privacy: 'private',
                properties: {
                    exp: expiracion,
                },
            }),
        });
        if (!roomRes.ok) {
            const err = await roomRes.text();
            throw new Error(`Error al crear sala en Daily.co [${roomRes.status}]: ${err}`);
        }
        const room = await roomRes.json();
        // ── 2. Generar token de propietario (doctor) ──────────────────────────
        const doctorToken = await this._crearToken(apiKey, room.name, expiracion, true);
        // ── 3. Generar token de participante (paciente) ───────────────────────
        const pacienteToken = await this._crearToken(apiKey, room.name, expiracion, false);
        return {
            urlAcceso: `${room.url}?t=${doctorToken}`,
            urlPaciente: `${room.url}?t=${pacienteToken}`,
            nombreSala: room.name,
        };
    }
    /**
     * Destruye una sala de Daily.co al finalizar la teleconsulta.
     */
    async eliminarSala(nombreSala) {
        const apiKey = process.env.DAILY_API_KEY;
        if (!apiKey) {
            console.error('eliminarSala: DAILY_API_KEY no configurada — la sala no será eliminada.');
            return;
        }
        try {
            const response = await fetch(`https://api.daily.co/v1/rooms/${nombreSala}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${apiKey}` },
            });
            if (response.ok || response.status === 404) {
                console.log(`🗑️  Sala Daily.co '${nombreSala}' eliminada (status: ${response.status}).`);
            }
            else {
                const body = await response.text();
                console.error(`❌ Error al eliminar sala '${nombreSala}' [${response.status}]: ${body}`);
            }
        }
        catch (err) {
            console.error(`❌ Error de red al eliminar sala '${nombreSala}':`, err);
        }
    }
    // ── Helpers ──────────────────────────────────────────────────────────────
    async _crearToken(apiKey, roomName, exp, isOwner) {
        const res = await fetch(DAILY_TOKENS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                properties: {
                    room_name: roomName,
                    is_owner: isOwner,
                    exp,
                },
            }),
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Error al crear meeting token Daily.co [${res.status}]: ${err}`);
        }
        const data = await res.json();
        return data.token;
    }
};
exports.DailyVideoService = DailyVideoService;
exports.DailyVideoService = DailyVideoService = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [])
], DailyVideoService);
