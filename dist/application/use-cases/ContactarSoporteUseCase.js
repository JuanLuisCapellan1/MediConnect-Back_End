"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactarSoporteUseCase = void 0;
const EmailTemplates_1 = require("../../infrastructure/external-services/EmailTemplates");
const CORREO_SOPORTE = 'servicios.mediconnect@gmail.com';
class ContactarSoporteUseCase {
    constructor(emailService) {
        this.emailService = emailService;
    }
    async execute(dto) {
        // 1. Notificar al equipo de soporte con todos los datos del formulario
        await this.emailService.enviarCorreo(CORREO_SOPORTE, `[Contacto] ${dto.asunto}`, (0, EmailTemplates_1.templateSoporteContacto)(dto.nombre, dto.correo, dto.asunto, dto.mensaje));
        // 2. Confirmar al remitente que se recibió su mensaje
        await this.emailService.enviarCorreo(dto.correo, 'Hemos recibido tu mensaje — MediConnect', (0, EmailTemplates_1.templateConfirmacionContacto)(dto.nombre, dto.asunto, dto.mensaje));
    }
}
exports.ContactarSoporteUseCase = ContactarSoporteUseCase;
