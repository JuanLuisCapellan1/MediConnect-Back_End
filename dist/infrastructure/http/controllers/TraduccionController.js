"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraduccionController = void 0;
const tsyringe_1 = require("tsyringe");
const TranslationHelper_1 = require("../../../application/services/TranslationHelper");
class TraduccionController {
    async traslate(req, res) {
        try {
            const translationHelper = tsyringe_1.container.resolve(TranslationHelper_1.TranslationHelper);
            const { translate_fields, // Array de campos a traducir
            source = 'es', // Idioma origen (default español)
            target = 'en', // Idioma destino (default inglés)
            format, // (Opcional) lo extraemos para que no vaya en 'restOfData'
            ...restOfData // El resto del JSON es la data médica
             } = req.body;
            // Validaciones básicas
            if (!translate_fields || !Array.isArray(translate_fields)) {
                return res.status(400).json({
                    error: "El campo 'translate_fields' es obligatorio y debe ser un array de strings."
                });
            }
            console.log(`--- Traducción Dinámica: ${source} -> ${target} ---`);
            // Ejecutamos la traducción usando los parámetros recibidos
            const datosTraducidos = await translationHelper.traducirObjeto(restOfData, // El objeto limpio (sin campos de config)
            translate_fields, // Qué campos tocar
            source, // Idioma origen
            target // Idioma destino
            );
            // Retornamos la respuesta
            return res.status(200).json({
                config: { source, target, fields: translate_fields },
                original: restOfData,
                result: datosTraducidos
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Error procesando la traducción dinámica' });
        }
    }
}
exports.TraduccionController = TraduccionController;
