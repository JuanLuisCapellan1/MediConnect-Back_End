"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuscribirseNewsletterUseCase = void 0;
const EmailTemplates_1 = require("../../infrastructure/external-services/EmailTemplates");
class SuscribirseNewsletterUseCase {
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    async execute(dto) {
        const correo = dto.correo.toLowerCase().trim();
        // Verificar si ya existe
        const existente = await this.prisma.suscripcionNewsletter.findUnique({
            where: { correo },
        });
        if (existente) {
            if (!existente.activo) {
                // Re-activar suscripción inactiva
                await this.prisma.suscripcionNewsletter.update({
                    where: { correo },
                    data: { activo: true },
                });
                await this.emailService.enviarCorreo(correo, '¡Bienvenido de vuelta al Newsletter de MediConnect!', (0, EmailTemplates_1.templateBienvenidaNewsletter)(correo));
                return { yaExistia: false };
            }
            return { yaExistia: true };
        }
        // Crear nueva suscripción
        await this.prisma.suscripcionNewsletter.create({
            data: { correo },
        });
        await this.emailService.enviarCorreo(correo, '¡Bienvenido al Newsletter de MediConnect!', (0, EmailTemplates_1.templateBienvenidaNewsletter)(correo));
        return { yaExistia: false };
    }
}
exports.SuscribirseNewsletterUseCase = SuscribirseNewsletterUseCase;
