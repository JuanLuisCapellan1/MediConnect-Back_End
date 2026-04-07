"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibreTranslateService = void 0;
const axios_1 = __importDefault(require("axios"));
const tsyringe_1 = require("tsyringe");
const RedisCacheService_1 = require("./RedisCacheService");
const crypto_1 = __importDefault(require("crypto"));
let LibreTranslateService = class LibreTranslateService {
    constructor(cache) {
        this.cache = cache;
        this.baseUrl = process.env.TRANSLATION_API_URL || 'http://localhost:5000';
    }
    async translate(text, sourceLang = 'es', targetLang = 'en') {
        // NORMALIZACIÓN: Aplicamos trim() dependiendo si es texto o array
        // Esto asegura que " hola " y "hola" generen el mismo hash.
        const textNormalized = Array.isArray(text)
            ? text.map(t => t.trim())
            : text.trim();
        // HASH: Generamos el hash usando el texto ya limpio
        const textHash = crypto_1.default.createHash('md5').update(JSON.stringify(textNormalized)).digest('hex');
        const cacheKey = `trans:${targetLang}:${textHash}`;
        try {
            const cachedResult = await this.cache.get(cacheKey);
            if (cachedResult) {
                // ¡Acierto de caché! Devolvemos el dato guardado sin llamar a la IA
                console.log('⚡ Recuperado desde Redis Cache');
                return JSON.parse(cachedResult);
            }
            const response = await axios_1.default.post(`${this.baseUrl}/translate`, {
                q: text,
                source: sourceLang,
                target: targetLang,
                format: 'text'
            });
            const traduccion = response.data.translatedText;
            //GUARDAR EN REDIS PARA LA PRÓXIMA (Por 24 horas = 86400 seg)
            this.cache.set(cacheKey, JSON.stringify(traduccion), 86400).catch(err => console.error("Error guardando cache", err));
            return traduccion;
        }
        catch (error) {
            console.error('Error en LibreTranslateService:', error);
            // Fallback: Si falla, devolvemos el texto original para no romper la UI
            return text;
        }
    }
};
exports.LibreTranslateService = LibreTranslateService;
exports.LibreTranslateService = LibreTranslateService = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(RedisCacheService_1.RedisCacheService)),
    __metadata("design:paramtypes", [RedisCacheService_1.RedisCacheService])
], LibreTranslateService);
