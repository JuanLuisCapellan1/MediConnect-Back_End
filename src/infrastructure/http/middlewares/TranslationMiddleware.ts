import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { TranslationHelper } from '../../../application/services/TranslationHelper';
import { TranslationCache } from './TranslationCache';
import { SUPPORTED_LANGUAGES } from '../../config/translation.config';

/**
 * Middleware de traducción automática para respuestas JSON
 * 
 * Uso:
 * GET /api/endpoint?source=es&target=en&translate_fields=nombre,descripcion
 * 
 * Query params:
 * - source: Idioma origen (opcional, default: 'es')
 * - target: Idioma destino (requerido para activar traducción)
 * - translate_fields: Campos a traducir separados por coma (requerido)
 * 
 * Características:
 * - Caché de traducciones para mejorar performance
 * - Validación de idiomas soportados
 * - Soporte para arrays y objetos anidados
 * - Manejo de errores sin interrumpir la respuesta
 */
export const translationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extraer parámetros de query
    const source = (req.query.source as string) || 'es';
    const target = req.query.target as string;
    const translateFieldsParam = req.query.translate_fields as string;

    // Si no hay target o campos, continuar sin traducción
    if (!target || !translateFieldsParam) {
      return next();
    }

    // Validar idiomas soportados
    if (!SUPPORTED_LANGUAGES.includes(source)) {
      return res.status(400).json({
        error: 'Idioma origen no soportado',
        supportedLanguages: SUPPORTED_LANGUAGES,
        received: source
      });
    }

    if (!SUPPORTED_LANGUAGES.includes(target)) {
      return res.status(400).json({
        error: 'Idioma destino no soportado',
        supportedLanguages: SUPPORTED_LANGUAGES,
        received: target
      });
    }

    // Parsear campos (pueden venir como "nombre,descripcion" o "nombre")
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

    // Interceptar el método res.json original
    const originalJson = res.json.bind(res);

    // Sobrescribir res.json para traducir antes de enviar
    res.json = function (body: any): Response {
      // Si no hay body o no es un objeto, enviar sin cambios
      if (!body || typeof body !== 'object') {
        return originalJson(body);
      }

      // Resolver dependencias
      const translationHelper = container.resolve(TranslationHelper);
      const cache = TranslationCache.getInstance();

      // Función auxiliar para traducir un objeto con caché (recursiva)
      const translateWithCache = async (obj: any): Promise<any> => {
        if (!obj || typeof obj !== 'object') return obj;

        // Si es un array, procesar cada elemento recursivamente
        if (Array.isArray(obj)) {
          return await Promise.all(obj.map(item => translateWithCache(item)));
        }

        const result: any = {};
        
        // Procesar cada propiedad del objeto
        for (const key of Object.keys(obj)) {
          const value = obj[key];
          
          // Manejar valores null o undefined
          if (value === null || value === undefined) {
            result[key] = value;
          }
          // Si el campo actual está en la lista de campos a traducir Y es un string no vacío
          else if (translateFields.includes(key) && typeof value === 'string' && value.trim().length > 0) {
            const originalText = value;
            
            // Buscar en caché
            const cached = cache.get(originalText, source, target);
            if (cached) {
              console.log(`💾 Cache hit: "${originalText.substring(0, 30)}..." [${key}]`);
              result[key] = cached;
            } else {
              // Si no está en caché, traducir y guardar
              try {
                const translated = await translationHelper.traducirObjeto(
                  { [key]: originalText },
                  [key],
                  source,
                  target
                );
                result[key] = translated[key];
                
                // Guardar en caché
                cache.set(originalText, result[key], source, target);
              } catch (error) {
                console.error(`❌ Error traduciendo campo "${key}":`, error);
                // Mantener el texto original en caso de error
                result[key] = originalText;
              }
            }
          }
          // Si el valor es un array, procesarlo recursivamente
          else if (Array.isArray(value)) {
            result[key] = await translateWithCache(value);
          }
          // Si el valor es un objeto (no Date, no null, no array), procesarlo recursivamente
          else if (typeof value === 'object' && !(value instanceof Date)) {
            result[key] = await translateWithCache(value);
          }
          // Para todo lo demás (strings que no se traducen, números, booleans, dates), copiar directamente
          else {
            result[key] = value;
          }
        }
        
        return result;
      };

      // Traducir de forma asíncrona
      (async () => {
        try {
          // Traducir todo el body de forma recursiva
          const translated = await translateWithCache(body);

          // Agregar metadata de traducción
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

        } catch (error) {
          console.error('❌ Error en middleware de traducción:', error);
          // En caso de error crítico, enviar respuesta original
          return originalJson(body);
        }
      })();

      // Retornar res para mantener la cadena
      return res;
    };

    next();
  } catch (error) {
    console.error('❌ Error crítico en middleware de traducción:', error);
    next(); // Continuar sin traducción en caso de error
  }
};