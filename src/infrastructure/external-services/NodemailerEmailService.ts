import { Resend } from 'resend';
import { injectable } from 'tsyringe';
import { IEmailService } from '../../application/interfaces/IEmailService';
import {
  templateCodigoRegistro,
  templateRecuperacionPassword,
} from './EmailTemplates';

/** Extrae el código OTP (6 dígitos) del texto del cuerpo */
function extraerOTP(cuerpo: string): string | null {
  const match = cuerpo.match(/\b(\d{6})\b/);
  return match ? match[1] : null;
}

@injectable()
export class NodemailerEmailService implements IEmailService {
  private resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.warn('⚠️  RESEND_API_KEY no configurada. El servicio de email no funcionará correctamente.');
    }

    // Resend usa HTTP (puerto 443) — compatible con Railway y cualquier cloud provider
    this.resend = new Resend(apiKey);
  }

  /**
   * Selecciona el template HTML apropiado basándose en el asunto del correo.
   * Si no coincide ningún patrón conocido, usa el layout genérico.
   */
  private resolverHtml(asunto: string, cuerpo: string): string {
    const otp = extraerOTP(cuerpo);

    if (/registro/i.test(asunto) && otp) {
      return templateCodigoRegistro(otp);
    }

    if (/recuperaci[oó]n|contrase[ñn]a/i.test(asunto) && otp) {
      return templateRecuperacionPassword(otp);
    }

    // Fallback genérico elegante para correos no tipificados
    return this.templateGenerico(asunto, cuerpo);
  }

  /** Layout de respaldo para asuntos no tipificados */
  private templateGenerico(asunto: string, cuerpo: string): string {
    const cuerpoHtml = cuerpo.replace(/\n/g, '<br>');
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${asunto}</title>
</head>
<body style="margin:0; padding:0; background-color:#F4F6F0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
    style="background-color:#F4F6F0; min-height:100vh;">
    <tr>
      <td align="center" style="padding: 48px 16px 40px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
          style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:#092610; border-radius:14px; padding:14px 28px;">
                    <span style="font-size:20px; font-weight:700; color:#FFFFFF; letter-spacing:0.5px;">MediConnect</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Tarjeta -->
          <tr>
            <td style="background-color:#FFFFFF; border-radius:20px; box-shadow:0 2px 20px rgba(9,38,16,0.07); overflow:hidden;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr><td style="background-color:#092610; height:4px; font-size:1px; line-height:1px;">&nbsp;</td></tr>
                <tr>
                  <td style="padding:40px;">
                    <h1 style="margin:0 0 16px; font-size:20px; font-weight:700; color:#092610;">${asunto}</h1>
                    <div style="font-size:15px; line-height:1.7; color:#3D5042;">${cuerpoHtml}</div>
                  </td>
                </tr>
                <tr><td style="padding:0 40px;"><div style="height:1px; background-color:#EFF2D7;"></div></td></tr>
                <tr>
                  <td style="padding:20px 40px 28px; text-align:center;">
                    <p style="margin:0; font-size:12px; color:#9AA694;">
                      Mensaje automático. No respondas a este correo.
                    </p>
                    <p style="margin:8px 0 0; font-size:11px; color:#C0CAB9;">© 2025 MediConnect</p>
                  </td>
                </tr>
              </table>
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
      // Si cuerpo ya es un documento HTML completo (generado por nuestros templates),
      // lo usamos directamente sin re-envolver en otro layout.
      const esHtmlCompleto = cuerpo.trimStart().startsWith('<!DOCTYPE html>') ||
                             cuerpo.trimStart().startsWith('<html');
      const html = esHtmlCompleto ? cuerpo : this.resolverHtml(asunto, cuerpo);

      const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'MediConnect <onboarding@resend.dev>';

      const { error } = await this.resend.emails.send({
        from,
        to: [destinatario],
        subject: asunto,
        text: cuerpo.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(), // fallback texto plano
        html,
      });

      if (error) {
        console.error('❌ [Email] Error de Resend:', error);
        throw new Error(error.message);
      }

      console.log(`✅ [Email] Enviado a ${destinatario} — Asunto: "${asunto}"`);
    } catch (error) {
      console.error('❌ [Email] Error al enviar correo:', error);
      throw new Error('No se pudo enviar el correo electrónico. Por favor, intente más tarde.');
    }
  }
}
