"use strict";
/**
 * Servicio de caché para traducciones
 * Implementa patrón Singleton con LRU (Least Recently Used)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationCache = void 0;
class TranslationCache {
    constructor() {
        this.MAX_CACHE_SIZE = 1000; // Máximo de entradas en caché
        this.CACHE_TTL = 3600000; // 1 hora en milisegundos
        this.cache = new Map();
        // Limpiar entradas expiradas cada 10 minutos
        setInterval(() => this.cleanExpiredEntries(), 600000);
    }
    /**
     * Obtener instancia singleton
     */
    static getInstance() {
        if (!TranslationCache.instance) {
            TranslationCache.instance = new TranslationCache();
        }
        return TranslationCache.instance;
    }
    /**
     * Generar clave única para el caché
     */
    generateKey(text, source, target) {
        return `${source}:${target}:${text}`;
    }
    /**
     * Obtener traducción del caché
     */
    get(text, source, target) {
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
    set(text, translation, source, target) {
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
    evictLeastUsed() {
        let oldestKey = null;
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
    cleanExpiredEntries() {
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
    getStats() {
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
    clear() {
        this.cache.clear();
        console.log('🗑️ Caché de traducciones limpiado completamente');
    }
    /**
     * Precalentar el caché con traducciones comunes
     */
    async warmUp(commonPhrases) {
        for (const phrase of commonPhrases) {
            this.set(phrase.text, phrase.translation, phrase.source, phrase.target);
        }
        console.log(`🔥 Caché precalentado con ${commonPhrases.length} traducciones comunes`);
    }
}
exports.TranslationCache = TranslationCache;
