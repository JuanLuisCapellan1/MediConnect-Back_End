import axios from 'axios';
import { inject, injectable } from 'tsyringe';
import { ITranslationService } from '../../application/interfaces/ITranslationService';
import { RedisCacheService } from './RedisCacheService';

@injectable()
export class LibreTranslateService implements ITranslationService {
  private readonly baseUrl = process.env.TRANSLATION_API_URL || 'http://localhost:5000';

  constructor(
    @inject(RedisCacheService) private cache: RedisCacheService
  ) {}

  async translate(text: string | string[], sourceLang: string = 'es', targetLang: string = 'en'): Promise<string | string[]> {
    const cacheKey = `trans_${targetLang}_${JSON.stringify(text)}`;

    try {
      const cachedResult = await this.cache.get(cacheKey);
      
      if (cachedResult) {
        // ¡Acierto de caché! Devolvemos el dato guardado sin llamar a la IA
        console.log('⚡ Recuperado desde Redis Cache');
        return JSON.parse(cachedResult);
      }

      const response = await axios.post(`${this.baseUrl}/translate`, {
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text'
      });

      const traduccion = response.data.translatedText;

      // 4. GUARDAR EN REDIS PARA LA PRÓXIMA (Por 24 horas = 86400 seg)
      await this.cache.set(cacheKey, JSON.stringify(traduccion), 16400);

      return traduccion;
    } catch (error) {
      console.error('Error en LibreTranslateService:', error);
      // Fallback: Si falla, devolvemos el texto original para no romper la UI
      return text;
    }
  }
}