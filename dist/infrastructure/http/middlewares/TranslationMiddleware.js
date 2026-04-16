"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translationMiddleware = void 0;
const tsyringe_1 = require("tsyringe");
const TranslationCache_1 = require("./TranslationCache");
const translation_config_1 = require("../../config/translation.config");
/**
 * Extrae el conjunto de nombres de campo hoja de un array de paths.
 *
 * Ejemplos:
 *   ["nombre", "servicio.nombre", "servicio.especialidad.nombre"]
 *   → Set { "nombre" }
 *
 *   ["nombre", "descripcion", "ubicacion.nombre"]
 *   → Set { "nombre", "descripcion" }
 *
 * Los campos simples y los de dot-notation se reducen al mismo nombre de hoja,
 * lo que permite traducirlos a cualquier profundidad con un único recorrido O(N).
 */
function buildLeafNames(fields) {
    const names = new Set();
    for (const f of fields) {
        const parts = f.split('.');
        names.add(parts[parts.length - 1]);
    }
    return names;
}
// ─────────────────────────────────────────────────────────────────────────────
// FASE 1 — Recolección  (O(N), puro JS, sin llamadas API)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Recorre todo el árbol JSON y agrega al Set `collector` todos los strings
 * cuya clave coincida con algún nombre de campo hoja.
 *
 * Complejidad: O(N) — cada nodo se visita exactamente una vez.
 */
function collectStrings(obj, leafNames, collector) {
    if (!obj || typeof obj !== 'object' || obj instanceof Date)
        return;
    if (Array.isArray(obj)) {
        for (const item of obj)
            collectStrings(item, leafNames, collector);
        return;
    }
    for (const key of Object.keys(obj)) {
        const value = obj[key];
        if (value === null || value === undefined)
            continue;
        if (leafNames.has(key)) {
            // Es un campo a traducir
            if (typeof value === 'string' && value.trim().length > 0) {
                collector.add(value);
            }
            else if (Array.isArray(value)) {
                for (const v of value) {
                    if (typeof v === 'string' && v.trim().length > 0)
                        collector.add(v);
                }
            }
        }
        // Continuar descendiendo en cualquier objeto/array independientemente de la clave
        if (value && typeof value === 'object' && !(value instanceof Date)) {
            collectStrings(value, leafNames, collector);
        }
    }
}
// ─────────────────────────────────────────────────────────────────────────────
// FASE 3 — Aplicación  (O(N), puro JS, sin llamadas API)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Recorre el árbol JSON y sustituye los valores usando `translationMap`.
 * Construye un nuevo objeto sin mutar el original.
 *
 * Complejidad: O(N) — cada nodo se visita exactamente una vez.
 */
function applyTranslations(obj, leafNames, translationMap) {
    if (!obj || typeof obj !== 'object' || obj instanceof Date)
        return obj;
    if (Array.isArray(obj)) {
        return obj.map(item => applyTranslations(item, leafNames, translationMap));
    }
    const result = {};
    for (const key of Object.keys(obj)) {
        const value = obj[key];
        if (value === null || value === undefined) {
            result[key] = value;
            continue;
        }
        if (leafNames.has(key)) {
            if (typeof value === 'string') {
                result[key] = translationMap.get(value) ?? value;
            }
            else if (Array.isArray(value)) {
                result[key] = value.map(v => typeof v === 'string' ? (translationMap.get(v) ?? v) : v);
            }
            else if (value && typeof value === 'object' && !(value instanceof Date)) {
                // El campo hoja es un objeto → descender normalmente
                result[key] = applyTranslations(value, leafNames, translationMap);
            }
            else {
                result[key] = value;
            }
        }
        else if (value && typeof value === 'object' && !(value instanceof Date)) {
            result[key] = applyTranslations(value, leafNames, translationMap);
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Middleware de traducción automática — estrategia BATCH en 3 fases.
 *
 * Query params:
 *   source          Idioma origen (opcional, default: 'es')
 *   target          Idioma destino (requerido para activar traducción)
 *   translate_fields Campos separados por coma. Soporta:
 *                    - Campos simples:    nombre,descripcion
 *                    - Dot-notation:      servicio.nombre,ubicacion.nombre
 *                    - Mezcla:            nombre,servicio.especialidad.nombre
 *
 * Flujo:
 *   1. collectStrings → recorre TODO el JSON en O(N), recolecta strings únicos
 *   2. Separa cacheados / nuevos → UNA sola llamada a la API con los nuevos
 *   3. applyTranslations → segundo recorrido O(N), solo lookups en memoria
 *
 * Resultado: máximo 1 llamada HTTP a la API de traducción por request,
 * sin importar cuántos campos ni cuán profundo estén anidados.
 */
const translationMiddleware = async (req, res, next) => {
    try {
        const source = req.query.source || 'es';
        const target = req.query.target;
        const translateFieldsParam = req.query.translate_fields;
        // Sin target o campos → pasar sin modificar
        if (!target || !translateFieldsParam)
            return next();
        if (!translation_config_1.SUPPORTED_LANGUAGES.includes(source)) {
            return res.status(400).json({
                error: 'Idioma origen no soportado',
                supportedLanguages: translation_config_1.SUPPORTED_LANGUAGES,
                received: source,
            });
        }
        if (!translation_config_1.SUPPORTED_LANGUAGES.includes(target)) {
            return res.status(400).json({
                error: 'Idioma destino no soportado',
                supportedLanguages: translation_config_1.SUPPORTED_LANGUAGES,
                received: target,
            });
        }
        const translateFields = translateFieldsParam.split(',').map(f => f.trim()).filter(Boolean);
        if (translateFields.length === 0)
            return next();
        console.log(`🌐 [Translation] ${source} → ${target} | campos: ${translateFields.join(', ')}`);
        const leafNames = buildLeafNames(translateFields);
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            if (!body || typeof body !== 'object')
                return originalJson(body);
            (async () => {
                try {
                    const cache = TranslationCache_1.TranslationCache.getInstance();
                    const translator = tsyringe_1.container.resolve('ITranslationService');
                    // ── FASE 1: Recolectar todos los strings a traducir ─────────────────
                    const toTranslateSet = new Set();
                    collectStrings(body, leafNames, toTranslateSet);
                    if (toTranslateSet.size === 0) {
                        // Nada que traducir → responder directamente
                        return originalJson({
                            ...body,
                            _translation: { source, target, fields: translateFields, timestamp: new Date().toISOString() },
                        });
                    }
                    // ── FASE 2: Separar cacheados de los que necesitan API ──────────────
                    const translationMap = new Map();
                    const needsApiCall = [];
                    for (const text of toTranslateSet) {
                        const cached = cache.get(text, source, target);
                        if (cached) {
                            translationMap.set(text, cached);
                        }
                        else {
                            needsApiCall.push(text);
                        }
                    }
                    console.log(`📊 [Translation] ${translationMap.size} en caché, ${needsApiCall.length} a traducir via API`);
                    // ── UNA SOLA llamada a la API (si hay textos nuevos) ─────────────────
                    if (needsApiCall.length > 0) {
                        const results = await translator.translate(needsApiCall, source, target);
                        const resultsArr = Array.isArray(results) ? results : [results];
                        needsApiCall.forEach((text, i) => {
                            const translated = resultsArr[i] ?? text;
                            translationMap.set(text, translated);
                            cache.set(text, translated, source, target);
                        });
                    }
                    // ── FASE 3: Aplicar traducciones ──────────────────────────────────
                    const translated = applyTranslations(body, leafNames, translationMap);
                    return originalJson({
                        ...translated,
                        _translation: {
                            source,
                            target,
                            fields: translateFields,
                            timestamp: new Date().toISOString(),
                        },
                    });
                }
                catch (err) {
                    console.error('❌ [Translation] Error en middleware:', err);
                    return originalJson(body);
                }
            })();
            return res;
        };
        next();
    }
    catch (err) {
        console.error('❌ [Translation] Error crítico:', err);
        next();
    }
};
exports.translationMiddleware = translationMiddleware;
