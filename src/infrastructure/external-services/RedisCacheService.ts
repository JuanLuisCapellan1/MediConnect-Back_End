import { createClient, RedisClientType } from 'redis';
import { injectable } from 'tsyringe';

@injectable()
export class RedisCacheService {
  private client: RedisClientType;

  constructor() {
    // Conecta a localhost:6379 (gracias a Docker)
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));
  }

  private async conectar() {
    if (this.client.isOpen) {
      return;
    }

    try {
      // Intentamos conectar
      await this.client.connect();
      console.log('✅ Conectado a Redis');
    } catch (error: any) {
      // Si el error es "Socket already opened", lo ignoramos (significa que otra petición ganó la carrera)
      if (error.message === 'Socket already opened') {
        return; 
      }
      // Si es otro error, lo lanzamos
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
}