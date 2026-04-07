"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translationRateLimitMiddleware = exports.TranslationRateLimiter = void 0;
exports.createTranslationRateLimiter = createTranslationRateLimiter;
class TranslationRateLimiter {
    constructor(windowMs = 15 * 60 * 1000, maxRequests = 1000) {
        this.requests = new Map();
        this.windowMs = windowMs; // 15 minutos por defecto
        this.maxRequests = maxRequests; // 100 peticiones por defecto
        // Limpiar entradas expiradas cada minuto
        setInterval(() => this.cleanExpiredEntries(), 60000);
    }
    static getInstance(windowMs, maxRequests) {
        if (!TranslationRateLimiter.instance) {
            TranslationRateLimiter.instance = new TranslationRateLimiter(windowMs, maxRequests);
        }
        return TranslationRateLimiter.instance;
    }
    /**
     * Obtener IP del cliente
     */
    getClientIp(req) {
        // Intenta obtener la IP real considerando proxies
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            return typeof forwarded === 'string'
                ? forwarded.split(',')[0].trim()
                : forwarded[0];
        }
        return req.ip || req.socket.remoteAddress || 'unknown';
    }
    /**
     * Verificar si el cliente ha excedido el límite
     */
    checkLimit(req) {
        const ip = this.getClientIp(req);
        const now = Date.now();
        let entry = this.requests.get(ip);
        // Si no existe entrada o ha expirado, crear nueva
        if (!entry || now > entry.resetTime) {
            entry = {
                count: 0,
                resetTime: now + this.windowMs
            };
            this.requests.set(ip, entry);
        }
        // Incrementar contador
        entry.count++;
        const remaining = Math.max(0, this.maxRequests - entry.count);
        const allowed = entry.count <= this.maxRequests;
        return {
            allowed,
            remaining,
            resetTime: entry.resetTime
        };
    }
    /**
     * Limpiar entradas expiradas
     */
    cleanExpiredEntries() {
        const now = Date.now();
        let cleaned = 0;
        for (const [ip, entry] of this.requests.entries()) {
            if (now > entry.resetTime) {
                this.requests.delete(ip);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            console.log(`🧹 Rate limiter: ${cleaned} entradas expiradas eliminadas`);
        }
    }
    /**
     * Obtener estadísticas del rate limiter
     */
    getStats() {
        const now = Date.now();
        const entries = Array.from(this.requests.entries()).map(([ip, entry]) => ({
            ip,
            requests: entry.count,
            resetIn: Math.max(0, Math.floor((entry.resetTime - now) / 1000))
        }));
        return {
            totalIPs: this.requests.size,
            topConsumers: entries
                .sort((a, b) => b.requests - a.requests)
                .slice(0, 10) // Top 10
        };
    }
    /**
     * Resetear límite para una IP específica (útil para testing o whitelist)
     */
    resetLimit(ip) {
        this.requests.delete(ip);
        console.log(`🔄 Rate limit reseteado para IP: ${ip}`);
    }
    /**
     * Limpiar todos los límites
     */
    clear() {
        this.requests.clear();
        console.log('🗑️ Rate limiter limpiado completamente');
    }
}
exports.TranslationRateLimiter = TranslationRateLimiter;
/**
 * Middleware factory para rate limiting de traducciones
 */
function createTranslationRateLimiter(windowMs = 15 * 60 * 1000, maxRequests = 1000) {
    const limiter = TranslationRateLimiter.getInstance(windowMs, maxRequests);
    return (req, res, next) => {
        // Solo aplicar rate limiting si hay parámetros de traducción
        const hasTranslationParams = req.query.target || req.query.translate_fields;
        if (!hasTranslationParams) {
            return next();
        }
        const { allowed, remaining, resetTime } = limiter.checkLimit(req);
        // Agregar headers informativos
        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', remaining.toString());
        res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());
        if (!allowed) {
            const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
            res.setHeader('Retry-After', retryAfter.toString());
            console.warn(`⚠️ Rate limit excedido para IP: ${req.ip}`);
            return res.status(429).json({
                error: 'Demasiadas solicitudes de traducción',
                message: 'Has excedido el límite de peticiones. Por favor, intenta más tarde.',
                retryAfter: retryAfter,
                resetTime: new Date(resetTime).toISOString()
            });
        }
        console.log(`✅ Rate limit OK - IP: ${req.ip}, Restantes: ${remaining}`);
        next();
    };
}
/**
 * Middleware de rate limiting con configuración por defecto
 */
exports.translationRateLimitMiddleware = createTranslationRateLimiter();
