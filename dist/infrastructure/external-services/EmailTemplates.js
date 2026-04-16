"use strict";
/**
 * EmailTemplates.ts
 *
 * Templates HTML premium para los correos de MediConnect.
 * Paleta de colores del sistema:
 *   Deep Forest Green  #092610
 *   Soft Sage          #D7E3C9
 *   Dusty Blue         #8BB1CA
 *   Pale Herbal Cream  #EFF2D7
 *   White              #FFFFFF
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateCodigoRegistro = templateCodigoRegistro;
exports.templateRecuperacionPassword = templateRecuperacionPassword;
exports.templateSoporteContacto = templateSoporteContacto;
exports.templateConfirmacionContacto = templateConfirmacionContacto;
exports.templateBienvenidaNewsletter = templateBienvenidaNewsletter;
// ─── Layout base ─────────────────────────────────────────────────────────────
function baseLayout(accentColor, contenido) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>MediConnect</title>
</head>
<body style="margin:0; padding:0; background-color:#F4F6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
    style="background-color:#F4F6F0; min-height:100vh;">
    <tr>
      <td align="center" style="padding: 48px 16px 40px;">

        <!-- Tarjeta principal -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
          style="max-width:560px;">

          <!-- Logo / cabecera -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="
                    background-color: #092610;
                    border-radius: 14px;
                    padding: 14px 28px;
                  ">
                    <span style="
                      font-size: 20px;
                      font-weight: 700;
                      color: #FFFFFF;
                      letter-spacing: 0.5px;
                    ">MediConnect</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cuerpo de la tarjeta -->
          <tr>
            <td style="
              background-color: #FFFFFF;
              border-radius: 20px;
              box-shadow: 0 2px 20px rgba(9,38,16,0.07);
              overflow: hidden;
            ">
              <!-- Banda de acento superior -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color: ${accentColor}; height: 4px; font-size: 1px; line-height: 1px;">&nbsp;</td>
                </tr>
              </table>

              <!-- Contenido inyectado -->
              ${contenido}

              <!-- Pie de la tarjeta -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="height: 1px; background-color: #EFF2D7;"></div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px 28px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #9AA694; line-height: 1.6;">
                      Este mensaje fue generado automáticamente. Por favor, no respondas a este correo.
                    </p>
                    <p style="margin: 8px 0 0; font-size: 11px; color: #C0CAB9;">
                      © 2025 MediConnect — Sistema de Salud Digital.
                    </p>
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
// ─── Bloque visual del código OTP ────────────────────────────────────────────
function otpBlock(codigo) {
    const digitos = codigo.split('');
    const celdas = digitos
        .map(d => `
      <td style="
        display: inline-block;
        width: 40px;
        height: 52px;
        line-height: 52px;
        text-align: center;
        background-color: #F4F6F0;
        border-radius: 10px;
        font-size: 26px;
        font-weight: 700;
        color: #092610;
        margin: 0 3px;
        letter-spacing: 0;
      ">${d}</td>
    `)
        .join('');
    return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
      <tr>${celdas}</tr>
    </table>
  `;
}
// ─── Bloque de cuenta regresiva visual ───────────────────────────────────────
function expiryBadge() {
    return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center"
      style="margin-top: 20px;">
      <tr>
        <td style="
          background-color: #EFF2D7;
          border-radius: 30px;
          padding: 8px 18px;
        ">
          <span style="font-size: 13px; color: #5C7356; font-weight: 600;">
            ⏱ Válido por 15 minutos
          </span>
        </td>
      </tr>
    </table>
  `;
}
// ─── Template: Código de registro ────────────────────────────────────────────
function templateCodigoRegistro(codigo) {
    const contenido = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">

      <!-- Ícono y título -->
      <tr>
        <td style="padding: 40px 40px 8px; text-align: center;">
          <div style="
            width: 64px; height: 64px; margin: 0 auto 20px;
            background-color: #EFF2D7;
            border-radius: 50%;
            font-size: 28px;
            line-height: 64px;
            text-align: center;
          ">✉️</div>
          <h1 style="
            margin: 0;
            font-size: 22px;
            font-weight: 700;
            color: #092610;
            line-height: 1.3;
          ">Verifica tu correo</h1>
          <p style="
            margin: 12px 0 0;
            font-size: 15px;
            color: #5C7356;
            line-height: 1.6;
          ">
            Usa el siguiente código para completar<br>tu registro en MediConnect.
          </p>
        </td>
      </tr>

      <!-- Código OTP -->
      <tr>
        <td style="padding: 32px 40px 8px; text-align: center;">
          ${otpBlock(codigo)}
          ${expiryBadge()}
        </td>
      </tr>

      <!-- Aviso de seguridad -->
      <tr>
        <td style="padding: 24px 40px 36px; text-align: center;">
          <p style="
            margin: 0;
            font-size: 13px;
            color: #9AA694;
            line-height: 1.6;
            max-width: 360px;
            margin: 0 auto;
          ">
            Si no solicitaste este código, ignora este mensaje. Tu cuenta está segura.
          </p>
        </td>
      </tr>

    </table>
  `;
    return baseLayout('#092610', contenido);
}
// ─── Template: Recuperación de contraseña ────────────────────────────────────
function templateRecuperacionPassword(codigo) {
    const contenido = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">

      <!-- Ícono y título -->
      <tr>
        <td style="padding: 40px 40px 8px; text-align: center;">
          <div style="
            width: 64px; height: 64px; margin: 0 auto 20px;
            background-color: #EFF2D7;
            border-radius: 50%;
            font-size: 28px; line-height: 64px; text-align: center;
          ">🔐</div>
          <h1 style="
            margin: 0;
            font-size: 22px;
            font-weight: 700;
            color: #092610;
            line-height: 1.3;
          ">Restablecer contraseña</h1>
          <p style="
            margin: 12px 0 0;
            font-size: 15px;
            color: #5C7356;
            line-height: 1.6;
          ">
            Recibimos una solicitud para cambiar la contraseña<br>de tu cuenta en MediConnect.
          </p>
        </td>
      </tr>

      <!-- Código OTP -->
      <tr>
        <td style="padding: 32px 40px 8px; text-align: center;">
          ${otpBlock(codigo)}
          ${expiryBadge()}
        </td>
      </tr>

      <!-- Alerta de seguridad -->
      <tr>
        <td style="padding: 24px 40px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="
                background-color: #FFF8EE;
                border-left: 3px solid #E8A838;
                border-radius: 8px;
                padding: 14px 18px;
              ">
                <p style="margin: 0; font-size: 13px; color: #7A5A1A; line-height: 1.6;">
                  <strong>⚠️ Seguridad:</strong> Si no solicitaste este cambio, cambia tu contraseña inmediatamente y contacta a soporte.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td style="padding: 0 40px 36px; text-align: center;">
          <p style="
            margin: 16px auto 0;
            font-size: 13px;
            color: #9AA694;
            line-height: 1.6;
            max-width: 360px;
          ">
            Este código es de un solo uso y expira en 15 minutos.
          </p>
        </td>
      </tr>

    </table>
  `;
    return baseLayout('#8BB1CA', contenido);
}
// ─── Template: Notificación interna de contacto (para el equipo de soporte) ──
function templateSoporteContacto(nombre, correoRemitente, asunto, mensaje) {
    const mensajeHtml = mensaje.replace(/\n/g, '<br>');
    const ahora = new Date().toLocaleString('es-DO', {
        timeZone: 'America/Santo_Domingo',
        dateStyle: 'full',
        timeStyle: 'short',
    });
    const contenido = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">

      <!-- Badge "Nuevo contacto" -->
      <tr>
        <td style="padding: 36px 40px 0; text-align: center;">
          <div style="
            display: inline-block;
            background-color: #EFF2D7;
            border-radius: 30px;
            padding: 6px 18px;
            font-size: 12px;
            font-weight: 700;
            color: #5C7356;
            letter-spacing: 0.8px;
            text-transform: uppercase;
          ">📬 Nuevo mensaje de contacto</div>
        </td>
      </tr>

      <!-- Título -->
      <tr>
        <td style="padding: 20px 40px 8px; text-align: center;">
          <h1 style="margin:0; font-size:24px; font-weight:800; color:#092610; line-height:1.3;">
            ${asunto}
          </h1>
          <p style="margin: 10px 0 0; font-size:13px; color:#9AA694;">Recibido el ${ahora}</p>
        </td>
      </tr>

      <!-- Divider -->
      <tr><td style="padding: 24px 40px 0;"><div style="height:1px; background:linear-gradient(90deg,transparent,#D7E3C9,transparent);"></div></td></tr>

      <!-- Datos del remitente -->
      <tr>
        <td style="padding: 28px 40px 0;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
            style="background:#F8FAF4; border-radius:14px; border-left:4px solid #092610;">
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 12px; font-size:11px; font-weight:700; color:#9AA694; text-transform:uppercase; letter-spacing:0.8px;">Remitente</p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="padding:4px 0; width:70px; vertical-align:top;">
                      <span style="font-size:13px; font-weight:600; color:#3D5042;">Nombre</span>
                    </td>
                    <td style="padding:4px 0; vertical-align:top;">
                      <span style="font-size:13px; color:#092610; font-weight:700;">${nombre}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0; vertical-align:top;">
                      <span style="font-size:13px; font-weight:600; color:#3D5042;">Correo</span>
                    </td>
                    <td style="padding:4px 0; vertical-align:top;">
                      <a href="mailto:${correoRemitente}" style="font-size:13px; color:#092610; text-decoration:none;">${correoRemitente}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Mensaje -->
      <tr>
        <td style="padding: 20px 40px 36px;">
          <p style="margin:0 0 12px; font-size:11px; font-weight:700; color:#9AA694; text-transform:uppercase; letter-spacing:0.8px;">Mensaje</p>
          <div style="
            background:#FFFFFF;
            border:1px solid #EFF2D7;
            border-radius:14px;
            padding:22px 24px;
            font-size:14px;
            line-height:1.8;
            color:#3D5042;
          ">${mensajeHtml}</div>
        </td>
      </tr>

    </table>
  `;
    return baseLayout('#092610', contenido);
}
// ─── Template: Confirmación al remitente del formulario de contacto ───────────
function templateConfirmacionContacto(nombre, asunto, mensaje) {
    const mensajeHtml = mensaje.replace(/\n/g, '<br>');
    const contenido = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">

      <!-- Icono de confirmación -->
      <tr>
        <td style="padding: 40px 40px 0; text-align: center;">
          <div style="
            width: 72px; height: 72px;
            margin: 0 auto 20px;
            background: linear-gradient(135deg, #EFF2D7 0%, #D7E3C9 100%);
            border-radius: 50%;
            font-size: 32px;
            line-height: 72px;
            text-align: center;
          ">✅</div>
          <h1 style="
            margin: 0;
            font-size: 26px;
            font-weight: 800;
            color: #092610;
            line-height: 1.3;
          ">¡Recibimos tu mensaje!</h1>
          <p style="
            margin: 14px auto 0;
            font-size: 15px;
            color: #5C7356;
            line-height: 1.7;
            max-width: 380px;
          ">Hola <strong>${nombre}</strong>, nuestro equipo revisará tu consulta y te responderá lo antes posible.</p>
        </td>
      </tr>

      <!-- Resumen del mensaje -->
      <tr>
        <td style="padding: 28px 40px 0;">
          <p style="margin:0 0 12px; font-size:11px; font-weight:700; color:#9AA694; text-transform:uppercase; letter-spacing:0.8px;">Resumen de tu mensaje</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
            style="background:#F8FAF4; border-radius:14px; overflow:hidden;">
            <tr>
              <td style="padding:18px 24px 14px;">
                <p style="margin:0 0 4px;">
                  <span style="font-size:11px; font-weight:700; color:#9AA694; text-transform:uppercase; letter-spacing:0.6px;">Asunto</span>
                </p>
                <p style="margin:0; font-size:15px; font-weight:700; color:#092610;">${asunto}</p>
              </td>
            </tr>
            <tr><td style="padding:0 24px;"><div style="height:1px;background:#EFF2D7;"></div></td></tr>
            <tr>
              <td style="padding:14px 24px 20px;">
                <p style="margin:0 0 4px;">
                  <span style="font-size:11px; font-weight:700; color:#9AA694; text-transform:uppercase; letter-spacing:0.6px;">Mensaje</span>
                </p>
                <p style="margin:0; font-size:14px; color:#3D5042; line-height:1.75;">${mensajeHtml}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Tiempo de respuesta estimado -->
      <tr>
        <td style="padding: 20px 40px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
            style="background:#F0F7FF; border-radius:12px; border-left:4px solid #8BB1CA;">
            <tr>
              <td style="padding:14px 20px;">
                <p style="margin:0; font-size:13px; color:#3A5A7A; line-height:1.6;">
                  ⏱ <strong>Tiempo de respuesta estimado:</strong> 24 a 48 horas hábiles.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Aviso -->
      <tr>
        <td style="padding: 24px 40px 36px; text-align: center;">
          <p style="margin:0 auto; font-size:12px; color:#C0CAB9; line-height:1.7; max-width:340px;">
            Si no enviaste este mensaje, puedes ignorar este correo con tranquilidad.
          </p>
        </td>
      </tr>

    </table>
  `;
    return baseLayout('#092610', contenido);
}
// ─── Template: Bienvenida al newsletter ──────────────────────────────────────
function templateBienvenidaNewsletter(correo) {
    const contenido = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">

      <!-- Hero -->
      <tr>
        <td style="padding: 40px 40px 0; text-align: center;">
          <div style="
            width: 80px; height: 80px;
            margin: 0 auto 22px;
            background: linear-gradient(135deg, #EFF2D7 0%, #D7E3C9 100%);
            border-radius: 50%;
            font-size: 36px;
            line-height: 80px;
            text-align: center;
          ">🎉</div>
          <h1 style="
            margin: 0;
            font-size: 26px;
            font-weight: 800;
            color: #092610;
            line-height: 1.3;
          ">¡Bienvenido al Newsletter<br>de MediConnect!</h1>
          <p style="
            margin: 16px auto 0;
            font-size: 14px;
            color: #5C7356;
            line-height: 1.7;
            max-width: 360px;
          ">
            Tu suscripción fue confirmada exitosamente para:
          </p>
          <p style="
            margin: 8px 0 0;
            font-size: 15px;
            font-weight: 700;
            color: #092610;
            background: #EFF2D7;
            display: inline-block;
            padding: 6px 18px;
            border-radius: 30px;
          ">${correo}</p>
        </td>
      </tr>

      <!-- Divider -->
      <tr><td style="padding:28px 40px 0;"><div style="height:1px;background:linear-gradient(90deg,transparent,#D7E3C9,transparent);"></div></td></tr>

      <!-- Beneficios -->
      <tr>
        <td style="padding: 24px 40px 0;">
          <p style="margin:0 0 16px; font-size:11px; font-weight:700; color:#9AA694; text-transform:uppercase; letter-spacing:0.8px;">Lo que recibirás</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="padding:0 0 12px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0"
                  style="background:#F8FAF4; border-radius:12px; width:100%;">
                  <tr>
                    <td style="padding:14px 20px; vertical-align:middle; width:40px; font-size:20px;">🚀</td>
                    <td style="padding:14px 20px 14px 0; vertical-align:middle;">
                      <p style="margin:0; font-size:14px; font-weight:700; color:#092610;">Nuevas funcionalidades</p>
                      <p style="margin:4px 0 0; font-size:13px; color:#5C7356;">Actualizaciones exclusivas del sistema</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 12px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0"
                  style="background:#F8FAF4; border-radius:12px; width:100%;">
                  <tr>
                    <td style="padding:14px 20px; vertical-align:middle; width:40px; font-size:20px;">🏥</td>
                    <td style="padding:14px 20px 14px 0; vertical-align:middle;">
                      <p style="margin:0; font-size:14px; font-weight:700; color:#092610;">Noticias de salud</p>
                      <p style="margin:4px 0 0; font-size:13px; color:#5C7356;">Contenido relevante del sector médico</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0"
                  style="background:#F8FAF4; border-radius:12px; width:100%;">
                  <tr>
                    <td style="padding:14px 20px; vertical-align:middle; width:40px; font-size:20px;">🎁</td>
                    <td style="padding:14px 20px 14px 0; vertical-align:middle;">
                      <p style="margin:0; font-size:14px; font-weight:700; color:#092610;">Promociones exclusivas</p>
                      <p style="margin:4px 0 0; font-size:13px; color:#5C7356;">Eventos y ofertas solo para suscriptores</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Aviso -->
      <tr>
        <td style="padding: 28px 40px 36px; text-align: center;">
          <p style="margin:0 auto; font-size:12px; color:#C0CAB9; line-height:1.7; max-width:340px;">
            Si no solicitaste esta suscripción, puedes ignorar este correo con tranquilidad.
          </p>
        </td>
      </tr>

    </table>
  `;
    return baseLayout('#D7E3C9', contenido);
}
