import { Request, Response } from 'express';
import { TranslationCache } from '../middlewares/TranslationCache';
import { TranslationRateLimiter } from '../middlewares/TranslationRateLimiter';
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, getLanguageName } from '../../config/translation.config';

/**
 * Controlador para gestionar utilidades de traducción
 * Proporciona endpoints para monitoreo, estadísticas y configuración
 */
export class TranslationUtilsController {

  /**
   * Obtener idiomas soportados
   * GET /api/translation/languages
   */
  async getLanguages(req: Request, res: Response): Promise<Response> {
    try {
      const languages = SUPPORTED_LANGUAGES.map(code => ({
        code,
        name: getLanguageName(code)
      }));

      return res.status(200).json({
        total: languages.length,
        languages: languages.sort((a, b) => a.name.localeCompare(b.name))
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error obteniendo idiomas' });
    }
  }

  /**
   * Obtener estadísticas del caché
   * GET /api/translation/cache/stats
   */
  async getCacheStats(req: Request, res: Response): Promise<Response> {
    try {
      const cache = TranslationCache.getInstance();
      const stats = cache.getStats();

      return res.status(200).json({
        cache: stats,
        message: 'Estadísticas del caché de traducciones'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error obteniendo estadísticas del caché' });
    }
  }

  /**
   * Limpiar el caché
   * DELETE /api/translation/cache
   */
  async clearCache(req: Request, res: Response): Promise<Response> {
    try {
      const cache = TranslationCache.getInstance();
      cache.clear();

      return res.status(200).json({
        message: 'Caché limpiado exitosamente'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error limpiando el caché' });
    }
  }

  /**
   * Obtener estadísticas del rate limiter
   * GET /api/translation/rate-limit/stats
   */
  async getRateLimitStats(req: Request, res: Response): Promise<Response> {
    try {
      const limiter = TranslationRateLimiter.getInstance();
      const stats = limiter.getStats();

      return res.status(200).json({
        rateLimiter: stats,
        message: 'Estadísticas del rate limiter'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error obteniendo estadísticas del rate limiter' });
    }
  }

  /**
   * Resetear rate limit para una IP específica
   * POST /api/translation/rate-limit/reset
   * Body: { ip: "192.168.1.1" }
   */
  async resetRateLimit(req: Request, res: Response): Promise<Response> {
    try {
      const { ip } = req.body;

      if (!ip) {
        return res.status(400).json({ error: 'IP es requerida' });
      }

      const limiter = TranslationRateLimiter.getInstance();
      limiter.resetLimit(ip);

      return res.status(200).json({
        message: `Rate limit reseteado para IP: ${ip}`
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error reseteando rate limit' });
    }
  }

  /**
   * Validar idioma
   * GET /api/translation/validate/:code
   */
  async validateLanguage(req: Request, res: Response): Promise<Response> {
    try {
      const code = req.params.code as string;
      const isSupported = SUPPORTED_LANGUAGES.includes(code);

      return res.status(200).json({
        code,
        supported: isSupported,
        name: isSupported ? getLanguageName(code) : 'Desconocido'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error validando idioma' });
    }
  }

  /**
   * Health check del sistema de traducción
   * GET /api/translation/health
   */
  async healthCheck(req: Request, res: Response): Promise<Response> {
    try {
      const cache = TranslationCache.getInstance();
      const limiter = TranslationRateLimiter.getInstance();

      const cacheStats = cache.getStats();
      const rateLimitStats = limiter.getStats();

      return res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        components: {
          cache: {
            status: 'operational',
            size: cacheStats.size,
            utilization: `${cacheStats.utilization.toFixed(2)}%`
          },
          rateLimiter: {
            status: 'operational',
            trackedIPs: rateLimitStats.totalIPs
          },
          languages: {
            status: 'operational',
            supported: SUPPORTED_LANGUAGES.length
          }
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ 
        status: 'unhealthy',
        error: 'Error en health check' 
      });
    }
  }
}
