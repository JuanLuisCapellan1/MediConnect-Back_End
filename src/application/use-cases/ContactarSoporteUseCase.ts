import { IEmailService } from '../interfaces/IEmailService';
import { ContactarSoporteDto } from '../dtos/ContactoDtos';
import {
  templateConfirmacionContacto,
  templateSoporteContacto,
} from '../../infrastructure/external-services/EmailTemplates';

const CORREO_SOPORTE = 'servicios.mediconnect@gmail.com';

export class ContactarSoporteUseCase {
  constructor(private emailService: IEmailService) {}

  async execute(dto: ContactarSoporteDto): Promise<void> {
    // 1. Notificar al equipo de soporte con todos los datos del formulario
    await this.emailService.enviarCorreo(
      CORREO_SOPORTE,
      `[Contacto] ${dto.asunto}`,
      templateSoporteContacto(dto.nombre, dto.correo, dto.asunto, dto.mensaje),
    );

    // 2. Confirmar al remitente que se recibió su mensaje
    await this.emailService.enviarCorreo(
      dto.correo,
      'Hemos recibido tu mensaje — MediConnect',
      templateConfirmacionContacto(dto.nombre, dto.asunto, dto.mensaje),
    );
  }
}
