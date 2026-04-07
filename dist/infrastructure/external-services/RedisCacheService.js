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
exports.RedisCacheService = exports.RedisNoDisponibleError = void 0;
const redis_1 = require("redis");
const tsyringe_1 = require("tsyringe");
/** Error cuando Redis no está disponible (no instalado o no en ejecución) */
class RedisNoDisponibleError extends Error {
    constructor(causa) {
        super(causa
            ? `Redis no está disponible: ${causa}`
            : 'Redis no está disponible. Asegúrate de tener Redis en ejecución (puerto 6379) o de definir REDIS_URL.');
        this.name = 'RedisNoDisponibleError';
    }
}
exports.RedisNoDisponibleError = RedisNoDisponibleError;
let RedisCacheService = class RedisCacheService {
    constructor() {
        this.url = process.env.REDIS_URL || 'redis://localhost:6379';
        this.client = (0, redis_1.createClient)({ url: this.url });
        this.client.on('error', (err) => console.error('Redis Client Error', err));
    }
    async conectar() {
        if (this.client.isOpen) {
            return;
        }
        try {
            await this.client.connect();
            console.log('✅ Conectado a Redis');
        }
        catch (error) {
            if (error && typeof error === 'object' && 'message' in error && error.message === 'Socket already opened') {
                return;
            }
            const msg = error instanceof Error ? error.message : String(error);
            if (msg.includes('ECONNREFUSED') || msg.includes('connect')) {
                throw new RedisNoDisponibleError(`No se pudo conectar a Redis en ${this.url}. ¿Está Redis en ejecución? (ej: redis-server o docker run redis)`);
            }
            throw error;
        }
    }
    // Método para GUARDAR datos
    async set(key, value, duracionSegundos = 3600) {
        await this.conectar();
        // Guardamos el valor y le ponemos expiración (TTL)
        await this.client.set(key, value, {
            EX: duracionSegundos
        });
    }
    // Método para OBTENER datos
    async get(key) {
        await this.conectar();
        return await this.client.get(key);
    }
    // Método para ELIMINAR datos
    async del(key) {
        await this.conectar();
        await this.client.del(key);
    }
    // Método para ELIMINAR múltiples claves por patrón (ej: "experiencias_laborales:doctor:123:*")
    async deleteByPattern(pattern) {
        await this.conectar();
        const keys = [];
        let cursor = '0';
        // SCAN es más seguro que KEYS para producción (no bloquea Redis)
        do {
            const result = await this.client.scan(cursor, {
                MATCH: pattern,
                COUNT: 100
            });
            cursor = result.cursor;
            keys.push(...result.keys);
        } while (cursor !== '0');
        // Eliminar todas las claves encontradas
        if (keys.length > 0) {
            await this.client.del(keys);
        }
    }
};
exports.RedisCacheService = RedisCacheService;
exports.RedisCacheService = RedisCacheService = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [])
], RedisCacheService);
