"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translationMiddleware = void 0;
const tsyringe_1 = require("tsyringe");
const TranslationHelper_1 = require("../../../application/services/TranslationHelper");
const TranslationCache_1 = require("./TranslationCache");
const translation_config_1 = require("../../config/translation.config");
/**
 * Convierte un array de campos (con posible dot-notation) en un árbol de rutas.
 * Campos planos ("nombre") y dot-notation ("ubicacion.nombre") pueden coexistir.
 *
 * @param fields ["nombre", "ubicacion.nombre", "centrosSalud.nombre"]
 * @returns { nombre: null, ubicacion: { nombre: null }, centrosSalud: { nombre: null } }
 */
function buildFieldTree(fields) {
    const tree = {};
    for (const field of fields) {
        const parts = field.split('.');
        let node = tree;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) {
                // Hoja: marcar como null si aún no tiene sub-árbol
                if (!(part in node)) {
                    node[part] = null;
                }
            }
            else {
                // Nodo intermedio: crear sub-árbol si hace falta
                if (node[part] === null || !(part in node)) {
                    node[part] = {};
                }
                node = node[part];
            }
        }
    }
    return tree;
}
/**
 * Middleware de traducción automática para respuestas JSON
 *
 * Uso básico (campo plano):
 *   GET /api/endpoint?source=es&target=en&translate_fields=nombre,descripcion
 *
 * Uso con array de objetos (dot-notation):
 *   GET /api/endpoint?target=en&translate_fields=nombre,ubicacion.nombre,centrosSalud.nombre
 *   → traduce `nombre` en el objeto raíz, `nombre` dentro de cada elemento de `ubicacion`,
 *     y `nombre` dentro de cada elemento de `centrosSalud`.
 *
 * Query params:
 * - source: Idioma origen (opcional, default: 'es')
 * - target: Idioma destino (requerido para activar traducción)
 * - translate_fields: Campos a traducir separados por coma (requerido)
 *
 * Características:
 * - Caché de traducciones para mejorar performance
 * - Validación de idiomas soportados
 * - Soporte para arrays y objetos anidados con dot-notation
 * - Manejo de errores sin interrumpir la respuesta
 */
const translationMiddleware = async (req, res, next) => {
    try {
        // Extraer parámetros de query
        const source = req.query.source || 'es';
        const target = req.query.target;
        const translateFieldsParam = req.query.translate_fields;
        // Si no hay target o campos, continuar sin traducción
        if (!target || !translateFieldsParam) {
            return next();
        }
        // Validar idiomas soportados
        if (!translation_config_1.SUPPORTED_LANGUAGES.includes(source)) {
            return res.status(400).json({
                error: 'Idioma origen no soportado',
                supportedLanguages: translation_config_1.SUPPORTED_LANGUAGES,
                received: source
            });
        }
        if (!translation_config_1.SUPPORTED_LANGUAGES.includes(target)) {
            return res.status(400).json({
                error: 'Idioma destino no soportado',
                supportedLanguages: translation_config_1.SUPPORTED_LANGUAGES,
                received: target
            });
        }
        // Parsear campos (pueden venir como "nombre,descripcion" o "nombre" o "ubicacion.nombre")
        const translateFields = translateFieldsParam
            .split(',')
            .map(f => f.trim())
            .filter(f => f.length > 0);
        // Validar que haya al menos un campo
        if (translateFields.length === 0) {
            return next();
        }
        console.log(`🌐 Middleware de traducción activado: ${source} -> ${target}`);
        console.log(`📝 Campos a traducir:`, translateFields);
        // Construir el árbol de rutas una sola vez
        const rootFieldTree = buildFieldTree(translateFields);
        // Interceptar el método res.json original
        const originalJson = res.json.bind(res);
        // Sobrescribir res.json para traducir antes de enviar
        res.json = function (body) {
            // Si no hay body o no es un objeto, enviar sin cambios
            if (!body || typeof body !== 'object') {
                return originalJson(body);
            }
            // Resolver dependencias
            const translationHelper = tsyringe_1.container.resolve(TranslationHelper_1.TranslationHelper);
            const cache = TranslationCache_1.TranslationCache.getInstance();
            /**
             * Recorre `obj` guiándose por `fieldTree`:
             * - Si `key` es hoja del árbol (null) y el valor es string → traduce.
             * - Si `key` es nodo intermedio del árbol → desciende al array/objeto con su sub-árbol.
             * - Si `key` no está en el árbol pero el valor es objeto/array → desciende con el árbol completo
             *   (para que los campos planos funcionen en cualquier nivel, como antes).
             */
            const translateWithCache = async (obj, fieldTree) => {
                if (!obj || typeof obj !== 'object')
                    return obj;
                // Si es un array, procesar cada elemento con el mismo árbol
                if (Array.isArray(obj)) {
                    return await Promise.all(obj.map(item => translateWithCache(item, fieldTree)));
                }
                const result = {};
                for (const key of Object.keys(obj)) {
                    const value = obj[key];
                    // Manejar valores null o undefined
                    if (value === null || value === undefined) {
                        result[key] = value;
                        continue;
                    }
                    const treeNode = fieldTree[key]; // undefined | null | FieldTree
                    if (treeNode === null) {
                        // ── HOJA: campo que debe traducirse ──────────────────────────────
                        if (typeof value === 'string' && value.trim().length > 0) {
                            const cached = cache.get(value, source, target);
                            if (cached) {
                                console.log(`💾 Cache hit: "${value.substring(0, 30)}..." [${key}]`);
                                result[key] = cached;
                            }
                            else {
                                try {
                                    const translated = await translationHelper.traducirObjeto({ [key]: value }, [key], source, target);
                                    result[key] = translated[key];
                                    cache.set(value, result[key], source, target);
                                }
                                catch (error) {
                                    console.error(`❌ Error traduciendo campo "${key}":`, error);
                                    result[key] = value; // mantener original en caso de error
                                }
                            }
                        }
                        else if (Array.isArray(value)) {
                            // El campo hoja es un array de strings → traducir cada elemento
                            result[key] = await translateWithCache(value, fieldTree);
                        }
                        else {
                            result[key] = value;
                        }
                    }
                    else if (treeNode !== undefined && typeof treeNode === 'object') {
                        // ── NODO INTERMEDIO: descender con el sub-árbol ───────────────────
                        if (Array.isArray(value)) {
                            result[key] = await Promise.all(value.map(item => translateWithCache(item, treeNode)));
                        }
                        else if (typeof value === 'object' && !(value instanceof Date)) {
                            result[key] = await translateWithCache(value, treeNode);
                        }
                        else {
                            result[key] = value;
                        }
                    }
                    else {
                        // ── CAMPO NO LISTADO: si es objeto/array, descender con el árbol raíz
                        // (mantiene el comportamiento legacy: campos planos funcionan a cualquier nivel)
                        if (Array.isArray(value)) {
                            result[key] = await translateWithCache(value, fieldTree);
                        }
                        else if (typeof value === 'object' && !(value instanceof Date)) {
                            result[key] = await translateWithCache(value, fieldTree);
                        }
                        else {
                            result[key] = value;
                        }
                    }
                }
                return result;
            };
            // Traducir de forma asíncrona
            (async () => {
                try {
                    const translated = await translateWithCache(body, rootFieldTree);
                    const responseWithMeta = {
                        ...translated,
                        _translation: {
                            source,
                            target,
                            fields: translateFields,
                            timestamp: new Date().toISOString()
                        }
                    };
                    return originalJson(responseWithMeta);
                }
                catch (error) {
                    console.error('❌ Error en middleware de traducción:', error);
                    return originalJson(body);
                }
            })();
            // Retornar res para mantener la cadena
            return res;
        };
        next();
    }
    catch (error) {
        console.error('❌ Error crítico en middleware de traducción:', error);
        next();
    }
};
exports.translationMiddleware = translationMiddleware;
