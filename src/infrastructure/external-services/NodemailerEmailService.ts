import nodemailer, { Transporter } from 'nodemailer';
import { injectable } from 'tsyringe';
import { IEmailService } from '../../application/interfaces/IEmailService';

@injectable()
export class NodemailerEmailService implements IEmailService {
  private transporter: Transporter;

  constructor() {
    // Configuración del transporter de Nodemailer
    // Usa variables de entorno para configuración segura
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpUser || !smtpPassword) {
      console.warn('⚠️  SMTP credentials no configuradas. El servicio de email no funcionará correctamente.');
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true para 465, false para otros puertos
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });
  }

  /**
   * Genera el HTML del correo con la identidad visual de MediConnect.
   * Colores: Deep Forest Green #092610, Soft Sage #D7E3C9, Dusty Blue #8BB1CA, Pale Herbal Cream #EFF2D7, White #FFFFFF.
   */
  private construirHtmlMediConnect(asunto: string, cuerpo: string): string {
    const cuerpoHtml = cuerpo.replace(/\n/g, '<br>');
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${asunto}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Raleway:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background-color:#EFF2D7; font-family: Raleway, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#EFF2D7;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px; background-color:#FFFFFF; border-radius:12px; overflow:hidden; box-shadow: 0 4px 24px rgba(9,38,16,0.08);">
          <!-- Cabecera MediConnect -->
          <tr>
            <td style="background-color:#092610; padding: 28px 32px; text-align:center;">
              <span style="font-family: Merriweather, Georgia, serif; font-size: 24px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.5px;">MediConnect</span>
            </td>
          </tr>
          <!-- Título del mensaje -->
          <tr>
            <td style="padding: 28px 32px 0 32px;">
              <h1 style="margin:0; font-family: Merriweather, Georgia, serif; font-size: 22px; font-weight: 700; color: #092610; line-height: 1.3;">${asunto}</h1>
            </td>
          </tr>
          <!-- Contenido -->
          <tr>
            <td style="padding: 20px 32px 28px 32px;">
              <div style="font-size: 16px; line-height: 1.65; color: #092610;">
                ${cuerpoHtml}
              </div>
            </td>
          </tr>
          <!-- Separador -->
          <tr>
            <td style="padding: 0 32px;">
              <hr style="margin:0; border:none; border-top: 1px solid #D7E3C9;">
            </td>
          </tr>
          <!-- Pie -->
          <tr>
            <td style="padding: 20px 32px 24px 32px; background-color:#EFF2D7;">
              <p style="margin:0; font-size: 13px; color: #092610; font-family: Raleway, Arial, sans-serif;">MediConnect — Sistema de Gestión Médica</p>
              <p style="margin: 6px 0 0 0; font-size: 12px; color: #8BB1CA;">Este correo fue enviado de forma automática. No responder a esta dirección.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  async enviarCorreo(destinatario: string, asunto: string, cuerpo: string): Promise<void> {
    try {
      const html = this.construirHtmlMediConnect(asunto, cuerpo);

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@mediconnect.com',
        to: destinatario,
        subject: asunto,
        text: cuerpo,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Correo enviado a ${destinatario}:`, info.messageId);
    } catch (error) {
      console.error('❌ Error enviando correo:', error);
      throw new Error('No se pudo enviar el correo electrónico. Por favor, intente más tarde.');
    }
  }
}
