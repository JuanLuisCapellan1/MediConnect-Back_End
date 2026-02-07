/**
 * Configuración de idiomas soportados para traducción
 * Basado en los idiomas disponibles en LibreTranslate
 */

export const SUPPORTED_LANGUAGES = [
  'es', // Español
  'en', // Inglés
];

/**
 * Nombres legibles de los idiomas
 */
export const LANGUAGE_NAMES: Record<string, string> = {
  es: 'Español',
  en: 'English',
};

/**
 * Configuración de rate limiting para traducción
 */
export const TRANSLATION_RATE_LIMITS = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100, // Máximo de peticiones por ventana
  message: 'Demasiadas solicitudes de traducción. Por favor, intente más tarde.'
};

/**
 * Configuración de caché
 */
export const TRANSLATION_CACHE_CONFIG = {
  maxSize: 1000, // Máximo de entradas en caché
  ttl: 3600000, // 1 hora en milisegundos
  cleanupInterval: 600000 // Limpiar cada 10 minutos
};

/**
 * Traducciones comunes para precalentar el caché
 */
export const COMMON_TRANSLATIONS = [
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
export function isLanguageSupported(language: string): boolean {
  return SUPPORTED_LANGUAGES.includes(language);
}

/**
 * Obtener nombre legible de un idioma
 */
export function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code] || code;
}
