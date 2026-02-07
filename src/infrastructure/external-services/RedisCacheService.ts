import { createClient, RedisClientType } from 'redis';
import { injectable } from 'tsyringe';

/** Error cuando Redis no está disponible (no instalado o no en ejecución) */
export class RedisNoDisponibleError extends Error {
  constructor(causa?: string) {
    super(
      causa
        ? `Redis no está disponible: ${causa}`
        : 'Redis no está disponible. Asegúrate de tener Redis en ejecución (puerto 6379) o de definir REDIS_URL.'
    );
    this.name = 'RedisNoDisponibleError';
  }
}

@injectable()
export class RedisCacheService {
  private client: RedisClientType;
  private url: string;

  constructor() {
    this.url = process.env.REDIS_URL || 'redis://localhost:6379';
    this.client = createClient({ url: this.url });

    this.client.on('error', (err) => console.error('Redis Client Error', err));
  }

  private async conectar(): Promise<void> {
    if (this.client.isOpen) {
      return;
    }

    try {
      await this.client.connect();
      console.log('✅ Conectado a Redis');
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'message' in error && (error as Error).message === 'Socket already opened') {
        return;
      }
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('ECONNREFUSED') || msg.includes('connect')) {
        throw new RedisNoDisponibleError(
          `No se pudo conectar a Redis en ${this.url}. ¿Está Redis en ejecución? (ej: redis-server o docker run redis)`
        );
      }
      throw error;
    }
  }

  // Método para GUARDAR datos
  async set(key: string, value: string, duracionSegundos: number = 3600): Promise<void> {
    await this.conectar();
    // Guardamos el valor y le ponemos expiración (TTL)
    await this.client.set(key, value, {
      EX: duracionSegundos
    });
  }

  // Método para OBTENER datos
  async get(key: string): Promise<string | null> {
    await this.conectar();
    return await this.client.get(key);
  }

  // Método para ELIMINAR datos
  async del(key: string): Promise<void> {
    await this.conectar();
    await this.client.del(key);
  }
}