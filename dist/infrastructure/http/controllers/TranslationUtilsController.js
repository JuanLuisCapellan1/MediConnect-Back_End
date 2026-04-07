"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationUtilsController = void 0;
const TranslationCache_1 = require("../middlewares/TranslationCache");
const TranslationRateLimiter_1 = require("../middlewares/TranslationRateLimiter");
const translation_config_1 = require("../../config/translation.config");
/**
 * Controlador para gestionar utilidades de traducción
 * Proporciona endpoints para monitoreo, estadísticas y configuración
 */
class TranslationUtilsController {
    /**
     * Obtener idiomas soportados
     * GET /api/translation/languages
     */
    async getLanguages(req, res) {
        try {
            const languages = translation_config_1.SUPPORTED_LANGUAGES.map(code => ({
                code,
                name: (0, translation_config_1.getLanguageName)(code)
            }));
            return res.status(200).json({
                total: languages.length,
                languages: languages.sort((a, b) => a.name.localeCompare(b.name))
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Error obteniendo idiomas' });
        }
    }
    /**
     * Obtener estadísticas del caché
     * GET /api/translation/cache/stats
     */
    async getCacheStats(req, res) {
        try {
            const cache = TranslationCache_1.TranslationCache.getInstance();
            const stats = cache.getStats();
            return res.status(200).json({
                cache: stats,
                message: 'Estadísticas del caché de traducciones'
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Error obteniendo estadísticas del caché' });
        }
    }
    /**
     * Limpiar el caché
     * DELETE /api/translation/cache
     */
    async clearCache(req, res) {
        try {
            const cache = TranslationCache_1.TranslationCache.getInstance();
            cache.clear();
            return res.status(200).json({
                message: 'Caché limpiado exitosamente'
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Error limpiando el caché' });
        }
    }
    /**
     * Obtener estadísticas del rate limiter
     * GET /api/translation/rate-limit/stats
     */
    async getRateLimitStats(req, res) {
        try {
            const limiter = TranslationRateLimiter_1.TranslationRateLimiter.getInstance();
            const stats = limiter.getStats();
            return res.status(200).json({
                rateLimiter: stats,
                message: 'Estadísticas del rate limiter'
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Error obteniendo estadísticas del rate limiter' });
        }
    }
    /**
     * Resetear rate limit para una IP específica
     * POST /api/translation/rate-limit/reset
     * Body: { ip: "192.168.1.1" }
     */
    async resetRateLimit(req, res) {
        try {
            const { ip } = req.body;
            if (!ip) {
                return res.status(400).json({ error: 'IP es requerida' });
            }
            const limiter = TranslationRateLimiter_1.TranslationRateLimiter.getInstance();
            limiter.resetLimit(ip);
            return res.status(200).json({
                message: `Rate limit reseteado para IP: ${ip}`
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Error reseteando rate limit' });
        }
    }
    /**
     * Validar idioma
     * GET /api/translation/validate/:code
     */
    async validateLanguage(req, res) {
        try {
            const code = req.params.code;
            const isSupported = translation_config_1.SUPPORTED_LANGUAGES.includes(code);
            return res.status(200).json({
                code,
                supported: isSupported,
                name: isSupported ? (0, translation_config_1.getLanguageName)(code) : 'Desconocido'
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Error validando idioma' });
        }
    }
    /**
     * Health check del sistema de traducción
     * GET /api/translation/health
     */
    async healthCheck(req, res) {
        try {
            const cache = TranslationCache_1.TranslationCache.getInstance();
            const limiter = TranslationRateLimiter_1.TranslationRateLimiter.getInstance();
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
                        supported: translation_config_1.SUPPORTED_LANGUAGES.length
                    }
                }
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({
                status: 'unhealthy',
                error: 'Error en health check'
            });
        }
    }
}
exports.TranslationUtilsController = TranslationUtilsController;
