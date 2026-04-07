import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ContactarSoporteUseCase } from '../../../application/use-cases/ContactarSoporteUseCase';
import { SuscribirseNewsletterUseCase } from '../../../application/use-cases/SuscribirseNewsletterUseCase';
import { ContactarSoporteDto, SuscribirseNewsletterDto } from '../../../application/dtos/ContactoDtos';

export class ContactoController {
  /**
   * POST /contacto/enviar
   * Envía el formulario de contacto al correo de soporte y confirma al remitente.
   */
  async enviarContacto(req: Request, res: Response): Promise<void> {
    try {
      const dto = plainToInstance(ContactarSoporteDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const messages = errors
          .flatMap(e => Object.values(e.constraints ?? {}))
          .join('; ');
        res.status(400).json({ success: false, message: messages });
        return;
      }

      const useCase = container.resolve(ContactarSoporteUseCase);
      await useCase.execute(dto);

      res.status(200).json({
        success: true,
        message: 'Mensaje enviado correctamente. Te hemos enviado una confirmación a tu correo.',
      });
    } catch (error) {
      console.error('[ContactoController] enviarContacto:', error);
      res.status(500).json({ success: false, message: 'Error al enviar el mensaje. Por favor, intenta más tarde.' });
    }
  }

  /**
   * POST /contacto/newsletter
   * Suscribe un correo al newsletter de MediConnect.
   */
  async suscribirseNewsletter(req: Request, res: Response): Promise<void> {
    try {
      const dto = plainToInstance(SuscribirseNewsletterDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const messages = errors
          .flatMap(e => Object.values(e.constraints ?? {}))
          .join('; ');
        res.status(400).json({ success: false, message: messages });
        return;
      }

      const useCase = container.resolve(SuscribirseNewsletterUseCase);
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
    } catch (error) {
      console.error('[ContactoController] suscribirseNewsletter:', error);
      res.status(500).json({ success: false, message: 'Error al procesar la suscripción. Por favor, intenta más tarde.' });
    }
  }
}
