"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactoController = void 0;
const tsyringe_1 = require("tsyringe");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const ContactarSoporteUseCase_1 = require("../../../application/use-cases/ContactarSoporteUseCase");
const SuscribirseNewsletterUseCase_1 = require("../../../application/use-cases/SuscribirseNewsletterUseCase");
const ContactoDtos_1 = require("../../../application/dtos/ContactoDtos");
class ContactoController {
    /**
     * POST /contacto/enviar
     * Envía el formulario de contacto al correo de soporte y confirma al remitente.
     */
    async enviarContacto(req, res) {
        try {
            const dto = (0, class_transformer_1.plainToInstance)(ContactoDtos_1.ContactarSoporteDto, req.body);
            const errors = await (0, class_validator_1.validate)(dto);
            if (errors.length > 0) {
                const messages = errors
                    .flatMap(e => Object.values(e.constraints ?? {}))
                    .join('; ');
                res.status(400).json({ success: false, message: messages });
                return;
            }
            const useCase = tsyringe_1.container.resolve(ContactarSoporteUseCase_1.ContactarSoporteUseCase);
            await useCase.execute(dto);
            res.status(200).json({
                success: true,
                message: 'Mensaje enviado correctamente. Te hemos enviado una confirmación a tu correo.',
            });
        }
        catch (error) {
            console.error('[ContactoController] enviarContacto:', error);
            res.status(500).json({ success: false, message: 'Error al enviar el mensaje. Por favor, intenta más tarde.' });
        }
    }
    /**
     * POST /contacto/newsletter
     * Suscribe un correo al newsletter de MediConnect.
     */
    async suscribirseNewsletter(req, res) {
        try {
            const dto = (0, class_transformer_1.plainToInstance)(ContactoDtos_1.SuscribirseNewsletterDto, req.body);
            const errors = await (0, class_validator_1.validate)(dto);
            if (errors.length > 0) {
                const messages = errors
                    .flatMap(e => Object.values(e.constraints ?? {}))
                    .join('; ');
                res.status(400).json({ success: false, message: messages });
                return;
            }
            const useCase = tsyringe_1.container.resolve(SuscribirseNewsletterUseCase_1.SuscribirseNewsletterUseCase);
            const { yaExistia } = await useCase.execute(dto);
            if (yaExistia) {
                res.status(200).json({
                    success: true,
                    message: 'Este correo ya está suscrito al newsletter de MediConnect.',
                });
                return;
            }
            res.status(201).json({
                success: true,
                message: '¡Te has suscrito al newsletter de MediConnect exitosamente! Revisa tu correo.',
            });
        }
        catch (error) {
            console.error('[ContactoController] suscribirseNewsletter:', error);
            res.status(500).json({ success: false, message: 'Error al procesar la suscripción. Por favor, intenta más tarde.' });
        }
    }
}
exports.ContactoController = ContactoController;
