export interface ITranslationService {
  /**
   * Traduce un texto o un array de textos.
   * @param text String único o Array de strings
   * @param sourceLang Idioma fuente (ej: 'es', 'fr')
   * @param targetLang Idioma destino (ej: 'en', 'fr')
   */
  translate(text: string | string[], sourceLang: string, targetLang: string): Promise<string | string[]>;
}