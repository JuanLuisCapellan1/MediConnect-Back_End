import { injectable } from 'tsyringe';
import { container } from 'tsyringe';
import { ITranslationService } from '../../application/interfaces/ITranslationService';
import { TranslationCache } from '../http/middlewares/TranslationCache';
import { SUPPORTED_LANGUAGES } from '../config/translation.config';

/**
 * Servicio de hidratación del caché de traducción.
 *
 * Cuando el admin crea o actualiza datos maestros (especialidades, servicios,
 * condiciones médicas, etc.), este servicio traduce los campos afectados de
 * forma inmediata y los guarda en el TranslationCache.
 *
 * Uso: llamar en fire-and-forget desde los use cases:
 *
 *   this.translationHydrator.hydrateStrings(['Cardiología']).catch(() => {});
 *
 * Si el ITranslationService no está disponible o falla, el error se traga
 * silenciosamente — la traducción se hará normalmente en el próximo request.
 */
@injectable()
export class TranslationHydrator {

    private readonly SOURCE_LANG = 'es';
    private readonly TARGET_LANGS = SUPPORTED_LANGUAGES.filter(l => l !== this.SOURCE_LANG);

    /**
     * Hidrata el caché con los strings dados.
     * @param strings - Strings a traducir (ej: ['Cardiología', 'Tratamiento cardiovascular'])
     */
    async hydrateStrings(strings: string[]): Promise<void> {
        const values = strings.filter(s => typeof s === 'string' && s.trim().length > 0);
        if (values.length === 0) return;

        let translator: ITranslationService | null = null;
        try {
            translator = container.resolve<ITranslationService>('ITranslationService');
        } catch {
            return; // Servicio no registrado — ignorar silenciosamente
        }

        const cache = TranslationCache.getInstance();

        for (const targetLang of this.TARGET_LANGS) {
            const needsTranslation = values.filter(v => !cache.get(v, this.SOURCE_LANG, targetLang));
            if (needsTranslation.length === 0) continue;

            try {
                const results = await translator.translate(needsTranslation, this.SOURCE_LANG, targetLang);
                const resultsArr = Array.isArray(results) ? results : [results];

                needsTranslation.forEach((text, i) => {
                    const translated = resultsArr[i] ?? text;
                    cache.set(text, translated, this.SOURCE_LANG, targetLang);
                });

                console.log(`🔄 [Hydrator] Cacheados ${needsTranslation.length} strings → ${targetLang}`);
            } catch (err) {
                console.warn(`⚠️ [Hydrator] Error al hidratar para ${targetLang}:`, (err as Error).message);
            }
        }
    }
}
