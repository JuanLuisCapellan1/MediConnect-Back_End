"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationWarmUpService = void 0;
const tsyringe_1 = require("tsyringe");
const TranslationCache_1 = require("../http/middlewares/TranslationCache");
const translation_config_1 = require("../config/translation.config");
/**
 * Servicio de precalentamiento del caché de traducción.
 *
 * Al arrancar el servidor:
 *  1. Instala las traducciones manuales del config (COMMON_TRANSLATIONS).
 *  2. Consulta todos los datos maestros de la BD (especialidades, servicios,
 *     condiciones médicas, seguros, tipos de seguro, tipos de centro de salud,
 *     ubicaciones, etc.).
 *  3. Hace UNA sola llamada batch a la API de traducción por cada par de idiomas
 *     con todos los strings nuevos (no presentes en el config manual).
 *  4. Guarda todo en el TranslationCache (TTL 24h).
 *
 * Resultado: cualquier request posterior obtiene 100% cache-hit para master data,
 * sin latencia adicional ni llamadas a la API de traducción.
 */
class TranslationWarmUpService {
    constructor(prisma) {
        this.prisma = prisma;
        this.SOURCE_LANG = 'es';
        this.TARGET_LANGS = translation_config_1.SUPPORTED_LANGUAGES.filter(l => l !== this.SOURCE_LANG);
    }
    async run() {
        console.log('🔥 [WarmUp] Iniciando precalentamiento del caché de traducción...');
        const startMs = Date.now();
        try {
            const cache = TranslationCache_1.TranslationCache.getInstance();
            // ── 1. Cargar traducciones manuales del config ────────────────────────
            await cache.warmUp(translation_config_1.COMMON_TRANSLATIONS);
            console.log(`✅ [WarmUp] ${translation_config_1.COMMON_TRANSLATIONS.length} traducciones manuales cargadas.`);
            // ── 2. Obtener datos maestros de la BD en paralelo ────────────────────
            const [especialidades, servicios, condicionesMedicas, seguros, tiposSeguros, tiposCentrosSalud, ubicaciones,] = await Promise.all([
                this.prisma.especialidad.findMany({ select: { nombre: true } }).catch(() => []),
                this.prisma.servicio.findMany({ select: { nombre: true, descripcion: true } }).catch(() => []),
                this.prisma.condicionMedica.findMany({ select: { nombre: true, descripcion: true } }).catch(() => []),
                this.prisma.seguroMedico.findMany({ select: { nombre: true } }).catch(() => []),
                this.prisma.tipoSeguro.findMany({ select: { nombre: true } }).catch(() => []),
                this.prisma.tipoCentroSalud.findMany({ select: { nombre: true } }).catch(() => []),
                this.prisma.ubicacion.findMany({ select: { nombre: true }, where: { nombre: { not: null } } }).catch(() => []),
            ]);
            // ── 3. Recolectar strings únicos (no vacíos) ──────────────────────────
            const allStrings = new Set();
            const addStrings = (rows, ...fields) => {
                for (const row of rows) {
                    for (const field of fields) {
                        const v = row[field];
                        if (typeof v === 'string' && v.trim().length > 0) {
                            allStrings.add(v.trim());
                        }
                    }
                }
            };
            addStrings(especialidades, 'nombre');
            addStrings(servicios, 'nombre', 'descripcion');
            addStrings(condicionesMedicas, 'nombre', 'descripcion');
            addStrings(seguros, 'nombre');
            addStrings(tiposSeguros, 'nombre');
            addStrings(tiposCentrosSalud, 'nombre');
            addStrings(ubicaciones, 'nombre');
            console.log(`📋 [WarmUp] ${allStrings.size} strings únicos encontrados en datos maestros.`);
            // ── 4. Para cada idioma destino, traducir en batch lo que no esté cacheado ─
            let translator = null;
            try {
                translator = tsyringe_1.container.resolve('ITranslationService');
            }
            catch {
                console.warn('⚠️ [WarmUp] ITranslationService no disponible. Solo se cargan traducciones manuales.');
            }
            for (const targetLang of this.TARGET_LANGS) {
                const needsTranslation = [];
                for (const text of allStrings) {
                    if (!cache.get(text, this.SOURCE_LANG, targetLang)) {
                        needsTranslation.push(text);
                    }
                }
                if (needsTranslation.length === 0) {
                    console.log(`✅ [WarmUp] ${targetLang}: todos en caché, nada nuevo que traducir.`);
                    continue;
                }
                if (!translator) {
                    console.warn(`⚠️ [WarmUp] ${targetLang}: ${needsTranslation.length} strings sin traducir (servicio no disponible).`);
                    continue;
                }
                console.log(`🌐 [WarmUp] ${targetLang}: traduciendo ${needsTranslation.length} strings en batch...`);
                try {
                    // Dividir en chunks de 100 para no saturar la API
                    const CHUNK_SIZE = 100;
                    for (let i = 0; i < needsTranslation.length; i += CHUNK_SIZE) {
                        const chunk = needsTranslation.slice(i, i + CHUNK_SIZE);
                        const results = await translator.translate(chunk, this.SOURCE_LANG, targetLang);
                        const resultsArr = Array.isArray(results) ? results : [results];
                        chunk.forEach((text, idx) => {
                            const translated = resultsArr[idx] ?? text;
                            cache.set(text, translated, this.SOURCE_LANG, targetLang);
                        });
                    }
                    console.log(`✅ [WarmUp] ${targetLang}: ${needsTranslation.length} strings cargados en caché.`);
                }
                catch (err) {
                    console.error(`❌ [WarmUp] Error al traducir batch para ${targetLang}:`, err);
                }
            }
            const elapsedMs = Date.now() - startMs;
            const stats = cache.getStats();
            console.log(`🏁 [WarmUp] Completado en ${elapsedMs}ms. Caché: ${stats.size}/${stats.maxSize} entradas (${stats.utilization.toFixed(1)}% utilización)`);
        }
        catch (err) {
            // El warm-up nunca debe bloquear el arranque del servidor
            console.error('❌ [WarmUp] Error durante precalentamiento (el servidor continúa normalmente):', err);
        }
    }
}
exports.TranslationWarmUpService = TranslationWarmUpService;
