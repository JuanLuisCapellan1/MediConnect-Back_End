"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationHydrator = void 0;
const tsyringe_1 = require("tsyringe");
const tsyringe_2 = require("tsyringe");
const TranslationCache_1 = require("../http/middlewares/TranslationCache");
const translation_config_1 = require("../config/translation.config");
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
let TranslationHydrator = class TranslationHydrator {
    constructor() {
        this.SOURCE_LANG = 'es';
        this.TARGET_LANGS = translation_config_1.SUPPORTED_LANGUAGES.filter(l => l !== this.SOURCE_LANG);
    }
    /**
     * Hidrata el caché con los strings dados.
     * @param strings - Strings a traducir (ej: ['Cardiología', 'Tratamiento cardiovascular'])
     */
    async hydrateStrings(strings) {
        const values = strings.filter(s => typeof s === 'string' && s.trim().length > 0);
        if (values.length === 0)
            return;
        let translator = null;
        try {
            translator = tsyringe_2.container.resolve('ITranslationService');
        }
        catch {
            return; // Servicio no registrado — ignorar silenciosamente
        }
        const cache = TranslationCache_1.TranslationCache.getInstance();
        for (const targetLang of this.TARGET_LANGS) {
            const needsTranslation = values.filter(v => !cache.get(v, this.SOURCE_LANG, targetLang));
            if (needsTranslation.length === 0)
                continue;
            try {
                const results = await translator.translate(needsTranslation, this.SOURCE_LANG, targetLang);
                const resultsArr = Array.isArray(results) ? results : [results];
                needsTranslation.forEach((text, i) => {
                    const translated = resultsArr[i] ?? text;
                    cache.set(text, translated, this.SOURCE_LANG, targetLang);
                });
                console.log(`🔄 [Hydrator] Cacheados ${needsTranslation.length} strings → ${targetLang}`);
            }
            catch (err) {
                console.warn(`⚠️ [Hydrator] Error al hidratar para ${targetLang}:`, err.message);
            }
        }
    }
};
exports.TranslationHydrator = TranslationHydrator;
exports.TranslationHydrator = TranslationHydrator = __decorate([
    (0, tsyringe_1.injectable)()
], TranslationHydrator);
