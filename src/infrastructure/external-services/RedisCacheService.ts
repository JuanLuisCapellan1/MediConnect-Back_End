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

  // Método para ELIMINAR datos
  async del(key: string): Promise<void> {
    await this.conectar();
    await this.client.del(key);
  }

  // Método para ELIMINAR múltiples claves por patrón (ej: "experiencias_laborales:doctor:123:*")
  async deleteByPattern(pattern: string): Promise<void> {
    await this.conectar();
    
    const keys: string[] = [];
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
}