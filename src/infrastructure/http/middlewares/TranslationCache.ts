/**
 * Servicio de caché para traducciones
 * Implementa patrón Singleton con LRU (Least Recently Used)
 */

interface CacheEntry {
  translation: string;
  timestamp: number;
  hits: number;
}

interface CacheKey {
  text: string;
  source: string;
  target: string;
}

export class TranslationCache {
  private static instance: TranslationCache;
  private cache: Map<string, CacheEntry>;
  private readonly MAX_CACHE_SIZE = 1000; // Máximo de entradas en caché
  private readonly CACHE_TTL = 3600000; // 1 hora en milisegundos

  private constructor() {
    this.cache = new Map();
    
    // Limpiar entradas expiradas cada 10 minutos
    setInterval(() => this.cleanExpiredEntries(), 600000);
  }

  /**
   * Obtener instancia singleton
   */
  public static getInstance(): TranslationCache {
    if (!TranslationCache.instance) {
      TranslationCache.instance = new TranslationCache();
    }
    return TranslationCache.instance;
  }

  /**
   * Generar clave única para el caché
   */
  private generateKey(text: string, source: string, target: string): string {
    return `${source}:${target}:${text}`;
  }

  /**
   * Obtener traducción del caché
   */
  public get(text: string, source: string, target: string): string | null {
    const key = this.generateKey(text, source, target);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Verificar si la entrada ha expirado
    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    // Actualizar contador de hits
    entry.hits++;
    entry.timestamp = now; // Actualizar timestamp para LRU

    return entry.translation;
  }

  /**
   * Guardar traducción en caché
   */
  public set(text: string, translation: string, source: string, target: string): void {
    const key = this.generateKey(text, source, target);

    // Si el caché está lleno, eliminar la entrada menos usada
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictLeastUsed();
    }

    this.cache.set(key, {
      translation,
      timestamp: Date.now(),
      hits: 0
    });
  }

  /**
   * Eliminar la entrada menos recientemente usada (LRU)
   */
  private evictLeastUsed(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`🗑️ Cache eviction: removida entrada antigua`);
    }
  }

  /**
   * Limpiar entradas expiradas
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Limpieza de caché: ${cleaned} entradas expiradas eliminadas`);
    }
  }

  /**
   * Obtener estadísticas del caché
   */
  public getStats(): {
    size: number;
    maxSize: number;
    utilization: number;
    entries: Array<{ key: string; hits: number; age: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key: key.substring(0, 50) + '...', // Truncar para legibilidad
      hits: entry.hits,
      age: Math.floor((now - entry.timestamp) / 1000) // Edad en segundos
    }));

    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      utilization: (this.cache.size / this.MAX_CACHE_SIZE) * 100,
      entries: entries.sort((a, b) => b.hits - a.hits).slice(0, 10) // Top 10
    };
  }

  /**
   * Limpiar todo el caché
   */
  public clear(): void {
    this.cache.clear();
    console.log('🗑️ Caché de traducciones limpiado completamente');
  }

  /**
   * Precalentar el caché con traducciones comunes
   */
  public async warmUp(commonPhrases: Array<{ text: string; translation: string; source: string; target: string }>): Promise<void> {
    for (const phrase of commonPhrases) {
      this.set(phrase.text, phrase.translation, phrase.source, phrase.target);
    }
    console.log(`🔥 Caché precalentado con ${commonPhrases.length} traducciones comunes`);
  }
}
