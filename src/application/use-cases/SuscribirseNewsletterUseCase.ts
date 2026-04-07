import { PrismaClient } from '@prisma/client';
import { IEmailService } from '../interfaces/IEmailService';
import { SuscribirseNewsletterDto } from '../dtos/ContactoDtos';
import { templateBienvenidaNewsletter } from '../../infrastructure/external-services/EmailTemplates';

export class SuscribirseNewsletterUseCase {
  constructor(
    private prisma: PrismaClient,
    private emailService: IEmailService,
  ) {}

  async execute(dto: SuscribirseNewsletterDto): Promise<{ yaExistia: boolean }> {
    const correo = dto.correo.toLowerCase().trim();

    // Verificar si ya existe
    const existente = await (this.prisma as any).suscripcionNewsletter.findUnique({
      where: { correo },
    });

    if (existente) {
      if (!existente.activo) {
        // Re-activar suscripción inactiva
        await (this.prisma as any).suscripcionNewsletter.update({
          where: { correo },
          data: { activo: true },
        });
        await this.emailService.enviarCorreo(
          correo,
          '¡Bienvenido de vuelta al Newsletter de MediConnect!',
          templateBienvenidaNewsletter(correo),
        );
        return { yaExistia: false };
      }
      return { yaExistia: true };
    }

    // Crear nueva suscripción
    await (this.prisma as any).suscripcionNewsletter.create({
      data: { correo },
    });

    await this.emailService.enviarCorreo(
      correo,
      '¡Bienvenido al Newsletter de MediConnect!',
      templateBienvenidaNewsletter(correo),
    );

    return { yaExistia: false };
  }
}
