import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de Rate Limiting para traducciones
 * Limita el número de peticiones por IP para evitar abuso del servicio
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class TranslationRateLimiter {
  private static instance: TranslationRateLimiter;
  private requests: Map<string, RateLimitEntry>;
  private readonly windowMs: number;
  private readonly maxRequests: number;

  private constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 1000) {
    this.requests = new Map();
    this.windowMs = windowMs; // 15 minutos por defecto
    this.maxRequests = maxRequests; // 100 peticiones por defecto

    // Limpiar entradas expiradas cada minuto
    setInterval(() => this.cleanExpiredEntries(), 60000);
  }

  public static getInstance(windowMs?: number, maxRequests?: number): TranslationRateLimiter {
    if (!TranslationRateLimiter.instance) {
      TranslationRateLimiter.instance = new TranslationRateLimiter(windowMs, maxRequests);
    }
    return TranslationRateLimiter.instance;
  }

  /**
   * Obtener IP del cliente
   */
  private getClientIp(req: Request): string {
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
  public checkLimit(req: Request): { allowed: boolean; remaining: number; resetTime: number } {
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
  private cleanExpiredEntries(): void {
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
  public getStats(): {
    totalIPs: number;
    topConsumers: Array<{ ip: string; requests: number; resetIn: number }>;
  } {
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
  public resetLimit(ip: string): void {
    this.requests.delete(ip);
    console.log(`🔄 Rate limit reseteado para IP: ${ip}`);
  }

  /**
   * Limpiar todos los límites
   */
  public clear(): void {
    this.requests.clear();
    console.log('🗑️ Rate limiter limpiado completamente');
  }
}

/**
 * Middleware factory para rate limiting de traducciones
 */
export function createTranslationRateLimiter(
  windowMs: number = 15 * 60 * 1000,
  maxRequests: number = 1000
) {
  const limiter = TranslationRateLimiter.getInstance(windowMs, maxRequests);

  return (req: Request, res: Response, next: NextFunction): void | Response => {
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
export const translationRateLimitMiddleware = createTranslationRateLimiter();
