"use strict";
/**
 * Configuración de idiomas soportados para traducción
 * Basado en los idiomas disponibles en LibreTranslate
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMON_TRANSLATIONS = exports.TRANSLATION_CACHE_CONFIG = exports.TRANSLATION_RATE_LIMITS = exports.LANGUAGE_NAMES = exports.SUPPORTED_LANGUAGES = void 0;
exports.isLanguageSupported = isLanguageSupported;
exports.getLanguageName = getLanguageName;
exports.SUPPORTED_LANGUAGES = [
    'es', // Español
    'en', // Inglés
];
/**
 * Nombres legibles de los idiomas
 */
exports.LANGUAGE_NAMES = {
    es: 'Español',
    en: 'English',
};
/**
 * Configuración de rate limiting para traducción
 */
exports.TRANSLATION_RATE_LIMITS = {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 100, // Máximo de peticiones por ventana
    message: 'Demasiadas solicitudes de traducción. Por favor, intente más tarde.'
};
/**
 * Configuración de caché
 */
exports.TRANSLATION_CACHE_CONFIG = {
    maxSize: 1000, // Máximo de entradas en caché
    ttl: 3600000, // 1 hora en milisegundos
    cleanupInterval: 600000 // Limpiar cada 10 minutos
};
/**
 * Traducciones comunes para precalentar el caché
 */
exports.COMMON_TRANSLATIONS = [
    { text: 'Buenos días', translation: 'Good morning', source: 'es', target: 'en' },
    { text: 'Buenas tardes', translation: 'Good afternoon', source: 'es', target: 'en' },
    { text: 'Buenas noches', translation: 'Good evening', source: 'es', target: 'en' },
    { text: 'Gracias', translation: 'Thank you', source: 'es', target: 'en' },
    { text: 'Por favor', translation: 'Please', source: 'es', target: 'en' },
    { text: 'Doctor', translation: 'Doctor', source: 'es', target: 'en' },
    { text: 'Enfermera', translation: 'Nurse', source: 'es', target: 'en' },
    { text: 'Hospital', translation: 'Hospital', source: 'es', target: 'en' },
    { text: 'Clínica', translation: 'Clinic', source: 'es', target: 'en' },
    { text: 'Paciente', translation: 'Patient', source: 'es', target: 'en' },
    { text: 'Cita', translation: 'Appointment', source: 'es', target: 'en' },
    { text: 'Consulta', translation: 'Consultation', source: 'es', target: 'en' },
    { text: 'Medicina', translation: 'Medicine', source: 'es', target: 'en' },
    { text: 'Tratamiento', translation: 'Treatment', source: 'es', target: 'en' },
    { text: 'Diagnóstico', translation: 'Diagnosis', source: 'es', target: 'en' }
];
/**
 * Validar si un idioma es soportado
 */
function isLanguageSupported(language) {
    return exports.SUPPORTED_LANGUAGES.includes(language);
}
/**
 * Obtener nombre legible de un idioma
 */
function getLanguageName(code) {
    return exports.LANGUAGE_NAMES[code] || code;
}
