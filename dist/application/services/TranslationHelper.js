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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationHelper = void 0;
const tsyringe_1 = require("tsyringe");
let TranslationHelper = class TranslationHelper {
    constructor(translator) {
        this.translator = translator;
    }
    /**
     * Toma un objeto cualquiera y traduce solo los campos especificados
     */
    async traducirObjeto(data, campos, idiomaOrigen = 'es', idiomaDestino = 'en') {
        if (!data)
            return data;
        // Extraer valores
        const valores = campos.map(campo => data[campo] || "");
        // Traducir en lote (1 sola petición HTTP)
        const traducciones = await this.translator.translate(valores, idiomaOrigen, idiomaDestino);
        // Aseguramos que sea un array (por si LibreTranslate devuelve string simple al enviar 1 solo valor)
        const arrayTraducciones = Array.isArray(traducciones) ? traducciones : [traducciones];
        // Reconstruir objeto (copia superficial)
        const resultado = { ...data };
        campos.forEach((campo, index) => {
            if (resultado[campo]) {
                resultado[campo] = arrayTraducciones[index];
            }
        });
        return resultado;
    }
};
exports.TranslationHelper = TranslationHelper;
exports.TranslationHelper = TranslationHelper = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('ITranslationService')),
    __metadata("design:paramtypes", [Object])
], TranslationHelper);
