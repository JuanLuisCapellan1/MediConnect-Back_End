import { createClient, RedisClientType } from 'redis';
import { injectable } from 'tsyringe';

@injectable()
export class RedisCacheService {
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    // Conecta a localhost:6379 (gracias a Docker)
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));

    // Conectamos una sola vez al iniciar
    this.conectar();
  }

  private async conectar() {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
      console.log('✅ Conectado a Redis');
    }
  }

  // Método para GUARDAR datos
  async set(key: string, value: string, duracionSegundos: number = 3600): Promise<void> {
    // Guardamos el valor y le ponemos expiración (TTL)
    await this.client.set(key, value, {
      EX: duracionSegundos
    });
  }

  // Método para OBTENER datos
  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }
}